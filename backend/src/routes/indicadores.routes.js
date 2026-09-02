import { Router } from "express";
import { query, queryOne } from "../config/db.js";
import { asyncHandler } from "../lib/http.js";
import { requierePermiso } from "../middleware/auth.js";

export const indicadoresRouter = Router();

const hoy = () => new Date().toISOString().slice(0, 10);
const fechaValida = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""));

/** Traduce ?periodo=hoy|semana|mes|anio|personalizado a un rango de fechas. */
function rango(req) {
  const periodo = String(req.query.periodo || "mes");

  if (periodo === "personalizado") {
    return {
      desde: fechaValida(req.query.fecha_inicio) ? req.query.fecha_inicio : hoy(),
      hasta: fechaValida(req.query.fecha_fin) ? req.query.fecha_fin : hoy(),
    };
  }

  const expresiones = {
    hoy: "CURDATE()",
    semana: "DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)",
    mes: "DATE_FORMAT(CURDATE(), '%Y-%m-01')",
    anio: "DATE_FORMAT(CURDATE(), '%Y-01-01')",
  };

  return { desdeSql: expresiones[periodo] || expresiones.mes, hasta: hoy() };
}

/** Devuelve [sqlDesde, params] segun venga fecha literal o expresion. */
function condicionFecha(r, campo = "fecha") {
  if (r.desdeSql) return { sql: `${campo} BETWEEN ${r.desdeSql} AND ?`, params: [r.hasta] };
  return { sql: `${campo} BETWEEN ? AND ?`, params: [r.desde, r.hasta] };
}

/** Filtros opcionales de marca, modulo y causa. */
function filtrosExtra(req, alias = "") {
  const condiciones = [];
  const params = [];

  if (req.query.id_modulo && req.query.id_modulo !== "all") {
    condiciones.push(`${alias}id_modulo = ?`);
    params.push(req.query.id_modulo);
  }

  return { sql: condiciones.length ? ` AND ${condiciones.join(" AND ")}` : "", params };
}

// =====================================================================
// GET /indicadores/resumen  -> KPIs del dashboard
// =====================================================================
indicadoresRouter.get(
  "/resumen",
  requierePermiso("Dashboard", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();

    const dia = await queryOne(
      `SELECT
         COALESCE(SUM(unidades_producidas), 0)   AS produccion_dia,
         COALESCE(SUM(unidades_defectuosas), 0)  AS defectuosas_dia,
         COALESCE(SUM(minutos_disponibles), 0)   AS minutos_disponibles,
         COALESCE(SUM(minutos_ganados), 0)       AS minutos_ganados,
         COALESCE(MAX(personas_totales), 0)      AS operarios_activos
       FROM vw_estado_planta_hora WHERE fecha = ?`,
      [fecha],
    );

    const mes = await queryOne(
      `SELECT
         COALESCE(SUM(unidades_producidas), 0) AS produccion_mes,
         COALESCE(SUM(minutos_disponibles), 0) AS minutos_disponibles,
         COALESCE(SUM(minutos_ganados), 0)     AS minutos_ganados
       FROM vw_estado_modulo_dia
       WHERE fecha BETWEEN DATE_FORMAT(?, '%Y-%m-01') AND ?`,
      [fecha, fecha],
    );

    const ordenes = await queryOne(
      `SELECT
         SUM(estado = 'EN_PROCESO') AS ordenes_en_proceso,
         SUM(estado = 'PENDIENTE')  AS ordenes_pendientes,
         SUM(estado = 'FINALIZADA') AS ordenes_finalizadas
       FROM ordenes_produccion`,
    );

    const metaDia = await queryOne(
      `SELECT COALESCE(SUM(meta_hora), 0) AS meta_dia
       FROM vw_registro_horario WHERE fecha = ?`,
      [fecha],
    );

    const eficiencia =
      dia.minutos_disponibles > 0 ? (dia.minutos_ganados * 100) / dia.minutos_disponibles : 0;
    const eficienciaMes =
      mes.minutos_disponibles > 0 ? (mes.minutos_ganados * 100) / mes.minutos_disponibles : 0;

    res.json({
      fecha,
      produccion_dia: Number(dia.produccion_dia),
      meta_dia: Math.round(Number(metaDia.meta_dia)),
      operarios_activos: Number(dia.operarios_activos),
      ordenes_en_proceso: Number(ordenes.ordenes_en_proceso || 0),
      ordenes_pendientes: Number(ordenes.ordenes_pendientes || 0),
      eficiencia: Number(eficiencia.toFixed(2)),
      eficiencia_mes: Number(eficienciaMes.toFixed(2)),
      produccion_mes: Number(mes.produccion_mes),
      porcentaje_defectos:
        dia.produccion_dia > 0
          ? Number(((dia.defectuosas_dia * 100) / dia.produccion_dia).toFixed(2))
          : 0,
      minutos_por_prenda:
        dia.produccion_dia > 0
          ? Number((dia.minutos_disponibles / dia.produccion_dia).toFixed(2))
          : 0,
      cumplimiento_meta:
        Number(metaDia.meta_dia) > 0
          ? Number(((dia.produccion_dia * 100) / Number(metaDia.meta_dia)).toFixed(2))
          : 0,
    });
  }),
);

// =====================================================================
// GET /indicadores/estado-modulos  -> tablero de planta del dia
// =====================================================================
indicadoresRouter.get(
  "/estado-modulos",
  requierePermiso("Dashboard", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();

    const filas = await query(
      `SELECT m.id_modulo, m.codigo, m.nombre, m.ubicacion, m.estado,
              m.capacidad_operarios, m.horas_jornada, m.umbral_cumplimiento,
              COALESCE(d.horas_registradas, 0)    AS horas_registradas,
              COALESCE(d.unidades_producidas, 0)  AS unidades_producidas,
              COALESCE(d.unidades_defectuosas, 0) AS unidades_defectuosas,
              COALESCE(d.promedio_personas, 0)    AS promedio_personas,
              COALESCE(d.eficiencia, 0)           AS eficiencia,
              COALESCE(d.prendas_por_hora, 0)     AS prendas_por_hora,
              COALESCE(d.meta_dia, 0)             AS meta_dia,
              COALESCE(d.facturacion_meta, 0)     AS facturacion_meta,
              COALESCE(d.facturacion_real, 0)     AS facturacion_real,
              d.cumplimiento_facturacion,
              COALESCE(d.minutos_perdidos_persona, 0) AS minutos_perdidos_persona,
              d.sam_observado,
              o.numero_orden, o.codigo_referencia, o.nombre_referencia,
              o.sam_pactado, o.porcentaje_avance
       FROM modulos m
       LEFT JOIN vw_estado_modulo_dia d ON d.id_modulo = m.id_modulo AND d.fecha = ?
       LEFT JOIN (
         -- Un modulo puede tener mas de una orden en proceso: se toma una sola
         -- (la mas antigua) para no duplicar la fila del tablero.
         SELECT v.*
         FROM vw_avance_orden v
         JOIN (
           SELECT id_modulo, MIN(id_orden_produccion) AS id_orden_produccion
           FROM vw_avance_orden
           WHERE estado = 'EN_PROCESO'
           GROUP BY id_modulo
         ) primera ON primera.id_orden_produccion = v.id_orden_produccion
       ) o ON o.id_modulo = m.id_modulo
       WHERE m.estado <> 'INACTIVO'
       ORDER BY m.orden_visual ASC, m.codigo ASC`,
      [fecha],
    );

    res.json({ fecha, datos: filas });
  }),
);

// =====================================================================
// GET /indicadores/planta-hora  -> la foto de la planta hora por hora
// =====================================================================
indicadoresRouter.get(
  "/planta-hora",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();
    res.json({
      fecha,
      datos: await query(
        "SELECT * FROM vw_estado_planta_hora WHERE fecha = ? ORDER BY hora_jornada",
        [fecha],
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/productividad-modulo
// =====================================================================
indicadoresRouter.get(
  "/productividad-modulo",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    const r = rango(req);
    const f = condicionFecha(r);
    const extra = filtrosExtra(req);

    res.json({
      datos: await query(
        `SELECT id_modulo, codigo_modulo, nombre_modulo,
                SUM(unidades_producidas)  AS total_producido,
                SUM(unidades_defectuosas) AS total_defectuoso,
                SUM(minutos_disponibles)  AS minutos_disponibles,
                SUM(minutos_ganados)      AS minutos_ganados,
                ROUND(CASE WHEN SUM(minutos_disponibles) = 0 THEN 0
                     ELSE SUM(minutos_ganados) * 100.0 / SUM(minutos_disponibles) END, 2) AS eficiencia,
                ROUND(CASE WHEN SUM(unidades_producidas) = 0 THEN 0
                     ELSE SUM(unidades_defectuosas) * 100.0 / SUM(unidades_producidas) END, 2) AS porcentaje_defectos
         FROM vw_estado_modulo_dia
         WHERE ${f.sql}${extra.sql}
         GROUP BY id_modulo, codigo_modulo, nombre_modulo
         ORDER BY eficiencia DESC`,
        [...f.params, ...extra.params],
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/productividad-operario
// =====================================================================
indicadoresRouter.get(
  "/productividad-operario",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    const r = rango(req);
    const f = condicionFecha(r);

    res.json({
      datos: await query(
        `SELECT id_operario, codigo_operario, nombre_operario, cargo,
                SUM(horas_participadas)      AS horas_participadas,
                ROUND(SUM(unidades_atribuidas), 1) AS total_producido,
                ROUND(AVG(eficiencia_promedio), 2) AS eficiencia
         FROM vw_productividad_operario
         WHERE ${f.sql}
         GROUP BY id_operario, codigo_operario, nombre_operario, cargo
         ORDER BY total_producido DESC
         LIMIT 15`,
        f.params,
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/causas  -> Pareto del tiempo perdido
// =====================================================================
indicadoresRouter.get(
  "/causas",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    const r = rango(req);
    const f = condicionFecha(r);

    // `minutos_perdidos` ahora son minutos-persona MEDIDOS: la supervisora
    // anota cuanto estuvo parado el modulo y por que. Antes se infierian
    // restando lo ganado a lo disponible, que mezclaba el tiempo perdido
    // con el ritmo del modulo.
    const datos = await query(
      `SELECT codigo_causa, nombre_causa, tipo_causa, responsable,
              SUM(horas_afectadas)           AS horas_afectadas,
              SUM(minutos_modulo)            AS minutos_modulo,
              SUM(minutos_perdidos)          AS minutos_perdidos,
              SUM(unidades_no_producidas)    AS unidades_no_producidas,
              SUM(facturacion_no_realizada)  AS facturacion_no_realizada
       FROM vw_perdidas_por_causa
       WHERE ${f.sql}
       GROUP BY codigo_causa, nombre_causa, tipo_causa, responsable
       ORDER BY minutos_perdidos DESC`,
      f.params,
    );

    const total = datos.reduce((suma, fila) => suma + Number(fila.minutos_perdidos), 0);
    const totalPesos = datos.reduce(
      (suma, fila) => suma + Number(fila.facturacion_no_realizada || 0), 0);
    let acumulado = 0;

    res.json({
      total_minutos_perdidos: total,
      total_facturacion_no_realizada: Number(totalPesos.toFixed(2)),
      datos: datos.map((fila) => {
        acumulado += Number(fila.minutos_perdidos);
        return {
          ...fila,
          minutos_modulo: Number(fila.minutos_modulo),
          minutos_perdidos: Number(fila.minutos_perdidos),
          unidades_no_producidas: Number(fila.unidades_no_producidas || 0),
          facturacion_no_realizada: Number(fila.facturacion_no_realizada || 0),
          porcentaje: total > 0 ? Number(((fila.minutos_perdidos * 100) / total).toFixed(2)) : 0,
          porcentaje_acumulado: total > 0 ? Number(((acumulado * 100) / total).toFixed(2)) : 0,
        };
      }),
    });
  }),
);

// =====================================================================
// GET /indicadores/sam  -> SAM pactado vs observado por referencia
//   Es el indicador que dice en que contratos se gana y en cuales se pierde.
// =====================================================================
indicadoresRouter.get(
  "/sam",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    res.json({
      datos: await query(
        `SELECT id_referencia, codigo_referencia, nombre_referencia, nombre_marca,
                nombre_cliente,
                ROUND(AVG(sam_pactado), 2)   AS sam_pactado,
                ROUND(AVG(sam_observado), 2) AS sam_observado,
                ROUND(AVG(sam_observado) - AVG(sam_pactado), 2) AS diferencia,
                ROUND(CASE WHEN AVG(sam_pactado) = 0 THEN 0
                     ELSE (AVG(sam_observado) - AVG(sam_pactado)) * 100.0 / AVG(sam_pactado) END, 2) AS desviacion_porcentaje,
                ROUND(AVG(tarifa_minuto_pactada), 2) AS tarifa_minuto_pactada,
                ROUND(AVG(tarifa_minuto_real), 2)    AS tarifa_minuto_real,
                SUM(unidades_producidas)             AS unidades_producidas,
                COUNT(*)                             AS ordenes
         FROM vw_avance_orden
         WHERE sam_observado IS NOT NULL
         GROUP BY id_referencia, codigo_referencia, nombre_referencia, nombre_marca, nombre_cliente
         ORDER BY desviacion_porcentaje DESC`,
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/curva-arranque/:idOrden
// =====================================================================
indicadoresRouter.get(
  "/curva-arranque/:idOrden",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    res.json({
      datos: await query(
        `SELECT hora_desde_inicio, fecha, hora_jornada, unidades_producidas,
                eficiencia, codigo_causa
         FROM vw_curva_arranque
         WHERE id_orden_produccion = ?
         ORDER BY hora_desde_inicio`,
        [req.params.idOrden],
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/lotes-estado  -> distribucion de lotes por estado
// =====================================================================
indicadoresRouter.get(
  "/lotes-estado",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (_req, res) => {
    res.json({
      datos: await query(
        "SELECT estado, COUNT(*) AS total FROM lotes GROUP BY estado ORDER BY total DESC",
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/tendencia  -> serie diaria de produccion y eficiencia
// =====================================================================
indicadoresRouter.get(
  "/tendencia",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (req, res) => {
    const r = rango(req);
    const f = condicionFecha(r);

    res.json({
      datos: await query(
        `SELECT fecha AS periodo,
                SUM(unidades_producidas) AS unidades_producidas,
                SUM(unidades_defectuosas) AS unidades_defectuosas,
                ROUND(CASE WHEN SUM(minutos_disponibles) = 0 THEN 0
                     ELSE SUM(minutos_ganados) * 100.0 / SUM(minutos_disponibles) END, 2) AS eficiencia
         FROM vw_estado_modulo_dia
         WHERE ${f.sql}
         GROUP BY fecha
         ORDER BY fecha`,
        f.params,
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/produccion-marca
// =====================================================================
indicadoresRouter.get(
  "/produccion-marca",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (_req, res) => {
    res.json({
      datos: await query(
        `SELECT nombre_marca, SUM(unidades_producidas) AS total_producido
         FROM vw_avance_orden
         WHERE unidades_producidas > 0
         GROUP BY nombre_marca
         ORDER BY total_producido DESC`,
      ),
    });
  }),
);

// =====================================================================
// GET /indicadores/ordenes-riesgo  -> lotes que no llegan a la fecha
// =====================================================================
indicadoresRouter.get(
  "/ordenes-riesgo",
  requierePermiso("Indicadores", "VER"),
  asyncHandler(async (_req, res) => {
    res.json({
      datos: await query(
        `SELECT numero_orden, codigo_lote, nombre_cliente, nombre_referencia,
                codigo_modulo, cantidad_programada, unidades_producidas,
                unidades_restantes, porcentaje_avance, fecha_fin_programada,
                DATEDIFF(fecha_fin_programada, CURDATE()) AS dias_restantes
         FROM vw_avance_orden
         WHERE estado IN ('PENDIENTE', 'EN_PROCESO')
           AND fecha_fin_programada IS NOT NULL
           AND DATEDIFF(fecha_fin_programada, CURDATE()) <= 7
         ORDER BY dias_restantes ASC, porcentaje_avance ASC`,
      ),
    });
  }),
);
