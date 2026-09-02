import { Router } from "express";
import { execute, query, queryOne } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requierePermiso } from "../middleware/auth.js";

export const capturaRouter = Router();

const hoy = () => new Date().toISOString().slice(0, 10);

const fechaValida = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""));

/**
 * Franjas que rigen una fecha.
 *
 * La planta no trabaja el mismo horario todos los dias: de martes a
 * viernes son 520 minutos y el sabado 440, y la ultima franja de cada
 * dia no dura 60. El alto de la rejilla y el ancho de cada franja salen
 * de aqui, no de un numero fijo: si la empresa cambia el horario se
 * cambia `jornada_franjas` y todo lo demas se acomoda solo.
 *
 * Un dia sin jornada (el domingo) devuelve una lista vacia.
 */
async function jornadaDeLaFecha(fecha) {
  const franjas = await query(
    `SELECT j.id_jornada, j.codigo AS codigo_jornada, j.nombre AS nombre_jornada,
            f.orden_franja, f.hora_inicio, f.hora_fin, f.minutos, f.etiqueta
     FROM jornada_dia jd
     JOIN jornadas j ON j.id_jornada = jd.id_jornada AND j.estado = 'ACTIVO'
     JOIN jornada_franjas f ON f.id_jornada = j.id_jornada
     WHERE jd.dia_semana = WEEKDAY(?) + 1
     ORDER BY f.orden_franja`,
    [fecha],
  );

  return {
    id_jornada: franjas[0]?.id_jornada ?? null,
    codigo: franjas[0]?.codigo_jornada ?? null,
    nombre: franjas[0]?.nombre_jornada ?? null,
    minutos_totales: franjas.reduce((total, f) => total + f.minutos, 0),
    franjas: franjas.map(({ orden_franja, hora_inicio, hora_fin, minutos, etiqueta }) => ({
      orden_franja,
      hora_inicio,
      hora_fin,
      minutos,
      etiqueta,
    })),
  };
}

/**
 * Orden que el modulo esta trabajando: primero la que ya arranco,
 * si no la siguiente pendiente por prioridad.
 *
 * De aqui salen las dos constantes de la hora: el SAM (minutos que el
 * cliente paga por prenda) y el valor de maquila (pesos que paga). La
 * supervisora no digita ninguno de los dos.
 */
async function ordenActivaDelModulo(idModulo) {
  return queryOne(
    `SELECT o.id_orden_produccion, o.numero_orden, o.cantidad_programada,
            o.valor_maquila_unidad, f.sam_pactado,
            r.codigo AS codigo_referencia, r.nombre AS nombre_referencia,
            m.nombre AS nombre_marca, l.codigo_lote,
            cli.razon_social AS nombre_cliente
     FROM ordenes_produccion o
     JOIN fichas_tecnicas f ON f.id_ficha_tecnica = o.id_ficha_tecnica
     JOIN referencias r ON r.id_referencia = f.id_referencia
     JOIN marcas m ON m.id_marca = r.id_marca
     JOIN lotes l ON l.id_lote = o.id_lote
     LEFT JOIN pedidos ped ON ped.id_pedido = o.id_pedido
     LEFT JOIN clientes cli ON cli.id_cliente = ped.id_cliente
     WHERE o.id_modulo = ? AND o.estado IN ('EN_PROCESO', 'PENDIENTE')
     ORDER BY FIELD(o.estado, 'EN_PROCESO', 'PENDIENTE'),
              FIELD(o.prioridad, 'URGENTE', 'ALTA', 'MEDIA', 'BAJA'),
              o.fecha_emision ASC
     LIMIT 1`,
    [idModulo],
  );
}

/** Minutos perdidos de un conjunto de registros, agrupados por registro. */
async function minutosPerdidosDe(idsRegistro) {
  if (idsRegistro.length === 0) return new Map();

  const filas = await query(
    `SELECT p.id_registro, p.id_causa, p.minutos, c.codigo, c.nombre, c.tipo
     FROM registro_minutos_perdidos p
     JOIN causas_desviacion c ON c.id_causa = p.id_causa
     WHERE p.id_registro IN (${idsRegistro.map(() => "?").join(",")})
     ORDER BY p.minutos DESC`,
    idsRegistro,
  );

  const porRegistro = new Map();
  filas.forEach((fila) => {
    if (!porRegistro.has(fila.id_registro)) porRegistro.set(fila.id_registro, []);
    porRegistro.get(fila.id_registro).push({
      id_causa: fila.id_causa,
      minutos: fila.minutos,
      codigo: fila.codigo,
      nombre: fila.nombre,
      tipo: fila.tipo,
    });
  });
  return porRegistro;
}

/**
 * Reemplaza los minutos perdidos de un registro.
 *
 * Es reemplazo y no suma: la supervisora corrige lo que digito, y si
 * borra una causa de la pantalla tiene que desaparecer de la base.
 */
async function guardarMinutosPerdidos(idRegistro, lineas) {
  await execute("DELETE FROM registro_minutos_perdidos WHERE id_registro = ?", [idRegistro]);
  for (const linea of lineas) {
    await execute(
      "INSERT INTO registro_minutos_perdidos (id_registro, id_causa, minutos) VALUES (?, ?, ?)",
      [idRegistro, linea.id_causa, linea.minutos],
    );
  }
}

/**
 * Normaliza y valida lo que llega en `minutos_perdidos`.
 * Devuelve solo las lineas con minutos > 0, sin causas repetidas.
 */
function normalizarPerdidas(crudo, minutosFranja) {
  if (!Array.isArray(crudo)) return [];

  const porCausa = new Map();
  crudo.forEach((linea) => {
    const idCausa = Number(linea?.id_causa ?? 0);
    const minutos = Number(linea?.minutos ?? 0);
    if (!idCausa || !Number.isFinite(minutos) || minutos <= 0) return;
    porCausa.set(idCausa, (porCausa.get(idCausa) ?? 0) + Math.round(minutos));
  });

  const lineas = [...porCausa].map(([id_causa, minutos]) => ({ id_causa, minutos }));
  const total = lineas.reduce((suma, linea) => suma + linea.minutos, 0);

  // Una franja de 40 minutos no puede haber perdido 60: seria un dato
  // que despues infla el Pareto y nadie sabe de donde salio.
  if (total > minutosFranja) {
    throw ApiError.badRequest(
      `Los minutos perdidos (${total}) superan los ${minutosFranja} minutos de la franja`,
      { minutos_franja: minutosFranja, minutos_perdidos: total },
    );
  }

  return lineas;
}

// =====================================================================
// GET /captura?fecha=YYYY-MM-DD
//   La rejilla completa del dia: modulos x franjas, con lo capturado y
//   lo pendiente. Es la pantalla que usa la supervisora en el recorrido.
// =====================================================================
capturaRouter.get(
  "/",
  requierePermiso("Captura", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();
    const jornada = await jornadaDeLaFecha(fecha);

    const modulos = await query(
      `SELECT id_modulo, codigo, nombre, ubicacion, capacidad_operarios,
              umbral_cumplimiento, estado
       FROM modulos
       WHERE estado <> 'INACTIVO'
       ORDER BY orden_visual ASC, codigo ASC`,
    );

    const registros = await query(
      `SELECT * FROM vw_registro_horario WHERE fecha = ? ORDER BY id_modulo, hora_jornada`,
      [fecha],
    );

    const causas = await query(
      `SELECT id_causa, codigo, nombre, tipo, responsable, requiere_nota
       FROM causas_desviacion WHERE estado = 'ACTIVO'
       ORDER BY orden_visual ASC`,
    );

    const perdidas = await minutosPerdidosDe(registros.map((r) => r.id_registro));

    // Ultimo valor de personas de cada modulo: se precarga en la siguiente franja.
    const ultimasPersonas = new Map();
    registros.forEach((registro) => {
      ultimasPersonas.set(registro.id_modulo, registro.personas_presentes);
    });

    const filas = await Promise.all(
      modulos.map(async (modulo) => {
        const propios = registros.filter((registro) => registro.id_modulo === modulo.id_modulo);
        const celdas = {};
        propios.forEach((registro) => {
          celdas[registro.hora_jornada] = {
            ...registro,
            minutos_perdidos_detalle: perdidas.get(registro.id_registro) ?? [],
          };
        });

        const orden = await ordenActivaDelModulo(modulo.id_modulo);

        const suma = (campo) => propios.reduce((total, r) => total + Number(r[campo] || 0), 0);
        const disponibles = suma("minutos_disponibles");
        const ganados = suma("minutos_ganados");
        const facturacionMeta = suma("facturacion_meta");

        return {
          ...modulo,
          orden,
          sam_sugerido: orden?.sam_pactado ?? null,
          precio_sugerido: orden?.valor_maquila_unidad ?? null,
          personas_sugeridas:
            ultimasPersonas.get(modulo.id_modulo) ?? modulo.capacidad_operarios,
          celdas,
          resumen: {
            franjas_registradas: propios.length,
            franjas_pendientes: Math.max(jornada.franjas.length - propios.length, 0),
            unidades_producidas: suma("unidades_producidas"),
            unidades_defectuosas: suma("unidades_defectuosas"),
            meta_dia: Number(suma("meta_hora").toFixed(2)),
            eficiencia: disponibles > 0 ? Number(((ganados * 100) / disponibles).toFixed(2)) : 0,
            facturacion_meta: Number(facturacionMeta.toFixed(2)),
            facturacion_real: Number(suma("facturacion_real").toFixed(2)),
            cumplimiento_facturacion:
              facturacionMeta > 0
                ? Number(((suma("facturacion_real") * 100) / facturacionMeta).toFixed(2))
                : null,
            minutos_perdidos: suma("minutos_perdidos"),
            minutos_perdidos_persona: suma("minutos_perdidos_persona"),
          },
        };
      }),
    );

    res.json({
      fecha,
      jornada,
      // `horas` se conserva para no romper a quien todavia lea la rejilla
      // por indice; el dato bueno es `jornada.franjas`.
      horas: jornada.franjas.map((franja) => franja.orden_franja),
      causas,
      modulos: filas,
      resumen: {
        celdas_totales: modulos.length * jornada.franjas.length,
        celdas_registradas: registros.length,
      },
    });
  }),
);

// =====================================================================
// PUT /captura
//   Guarda una celda de la rejilla. Es idempotente: si la celda ya existe
//   se actualiza (la supervisora puede corregir lo que digito).
// =====================================================================
capturaRouter.put(
  "/",
  requierePermiso("Captura", "CREAR"),
  asyncHandler(async (req, res) => {
    const {
      id_modulo,
      fecha,
      hora_jornada,
      personas_presentes,
      unidades_producidas,
      unidades_defectuosas = 0,
      id_causa = null,
      nota = null,
      id_orden_produccion = null,
      minutos_perdidos = [],
    } = req.body || {};

    if (!id_modulo || !hora_jornada) {
      throw ApiError.badRequest("id_modulo y hora_jornada son obligatorios");
    }
    if (!fechaValida(fecha)) {
      throw ApiError.badRequest("La fecha debe tener formato YYYY-MM-DD");
    }

    const modulo = await queryOne(
      "SELECT id_modulo, umbral_cumplimiento FROM modulos WHERE id_modulo = ?",
      [id_modulo],
    );
    if (!modulo) throw ApiError.notFound("El modulo no existe");

    if (fecha > hoy()) {
      throw ApiError.badRequest("No se puede registrar produccion de una fecha futura");
    }

    // La franja manda: si ese dia no existe, no hay nada que capturar.
    const jornada = await jornadaDeLaFecha(fecha);
    if (jornada.franjas.length === 0) {
      throw ApiError.badRequest(`El ${fecha} no tiene jornada configurada: no es un dia laboral`);
    }

    const franja = jornada.franjas.find((f) => f.orden_franja === Number(hora_jornada));
    if (!franja) {
      throw ApiError.badRequest(
        `La jornada ${jornada.codigo} tiene ${jornada.franjas.length} franjas: ` +
          `la ${hora_jornada} no existe`,
      );
    }

    const personas = Number(personas_presentes ?? 0);
    const producidas = Number(unidades_producidas ?? 0);
    const defectuosas = Number(unidades_defectuosas ?? 0);

    if (personas < 0 || producidas < 0 || defectuosas < 0) {
      throw ApiError.badRequest("Las cantidades no pueden ser negativas");
    }
    if (defectuosas > producidas) {
      throw ApiError.badRequest("Las unidades defectuosas no pueden superar las producidas");
    }

    const perdidas = normalizarPerdidas(minutos_perdidos, franja.minutos);

    // La orden, el SAM y la tarifa salen del backend: no se digitan.
    const orden = id_orden_produccion
      ? await queryOne(
          `SELECT o.id_orden_produccion, o.valor_maquila_unidad, f.sam_pactado
           FROM ordenes_produccion o
           JOIN fichas_tecnicas f ON f.id_ficha_tecnica = o.id_ficha_tecnica
           WHERE o.id_orden_produccion = ?`,
          [id_orden_produccion],
        )
      : await ordenActivaDelModulo(id_modulo);

    const sam = orden?.sam_pactado ?? null;
    const precio = orden?.valor_maquila_unidad ?? null;

    // Regla: si el cumplimiento cae bajo el umbral, la causa es obligatoria.
    // La meta se mide contra los minutos REALES de la franja: con el 60
    // fijo, la franja de 40 pedia causa aunque el modulo fuera bien.
    const meta = sam && personas > 0 ? (personas * franja.minutos) / Number(sam) : 0;
    const cumplimiento = meta > 0 ? (producidas * 100) / meta : 0;
    const bajoUmbral = meta > 0 && cumplimiento < Number(modulo.umbral_cumplimiento);

    // Si la supervisora ya explico con minutos donde se fue el tiempo, la
    // causa principal es la que mas peso: no se le pide dos veces.
    const causaPrincipal =
      id_causa ||
      (perdidas.length > 0
        ? perdidas.reduce((mayor, linea) => (linea.minutos > mayor.minutos ? linea : mayor)).id_causa
        : null);

    if (bajoUmbral && !causaPrincipal) {
      throw ApiError.badRequest(
        `El cumplimiento (${cumplimiento.toFixed(0)}%) esta por debajo del umbral ` +
          `(${modulo.umbral_cumplimiento}%): debe indicar la causa`,
        { requiere_causa: true, cumplimiento: Number(cumplimiento.toFixed(2)) },
      );
    }

    if (causaPrincipal) {
      const causa = await queryOne(
        "SELECT id_causa, requiere_nota FROM causas_desviacion WHERE id_causa = ? AND estado = 'ACTIVO'",
        [causaPrincipal],
      );
      if (!causa) throw ApiError.badRequest("La causa indicada no existe o esta inactiva");
      if (causa.requiere_nota && !String(nota || "").trim()) {
        throw ApiError.badRequest("Esta causa exige una nota explicando lo que paso", {
          requiere_nota: true,
        });
      }
    }

    // Las causas de los minutos perdidos tambien tienen que existir.
    if (perdidas.length > 0) {
      const validas = await query(
        `SELECT id_causa FROM causas_desviacion
         WHERE estado = 'ACTIVO' AND id_causa IN (${perdidas.map(() => "?").join(",")})`,
        perdidas.map((linea) => linea.id_causa),
      );
      if (validas.length !== perdidas.length) {
        throw ApiError.badRequest("Alguna causa de los minutos perdidos no existe o esta inactiva");
      }
    }

    await execute(
      `INSERT INTO registros_horarios
         (id_modulo, fecha, hora_jornada, minutos_franja, id_orden_produccion,
          personas_presentes, unidades_producidas, unidades_defectuosas,
          sam_aplicado, precio_aplicado, id_causa, nota, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         minutos_franja      = VALUES(minutos_franja),
         id_orden_produccion = VALUES(id_orden_produccion),
         personas_presentes  = VALUES(personas_presentes),
         unidades_producidas = VALUES(unidades_producidas),
         unidades_defectuosas= VALUES(unidades_defectuosas),
         sam_aplicado        = VALUES(sam_aplicado),
         precio_aplicado     = VALUES(precio_aplicado),
         id_causa            = VALUES(id_causa),
         nota                = VALUES(nota),
         registrado_por      = VALUES(registrado_por),
         estado              = 'REGISTRADO'`,
      [
        id_modulo, fecha, hora_jornada, franja.minutos, orden?.id_orden_produccion ?? null,
        personas, producidas, defectuosas, sam, precio,
        causaPrincipal || null, nota || null, req.usuario.id_usuario,
      ],
    );

    const guardado = await queryOne(
      "SELECT * FROM vw_registro_horario WHERE id_modulo = ? AND fecha = ? AND hora_jornada = ?",
      [id_modulo, fecha, hora_jornada],
    );

    await guardarMinutosPerdidos(guardado.id_registro, perdidas);

    // Al primer registro, la orden pasa a EN_PROCESO automaticamente.
    if (orden?.id_orden_produccion && producidas > 0) {
      await execute(
        `UPDATE ordenes_produccion
         SET estado = IF(estado = 'PENDIENTE', 'EN_PROCESO', estado),
             fecha_inicio_real = COALESCE(fecha_inicio_real, ?)
         WHERE id_orden_produccion = ?`,
        [fecha, orden.id_orden_produccion],
      );
    }

    const final = await queryOne(
      "SELECT * FROM vw_registro_horario WHERE id_registro = ?",
      [guardado.id_registro],
    );

    res.json({ ...final, minutos_perdidos_detalle: perdidas });
  }),
);

// =====================================================================
// DELETE /captura/:id  -> anula un registro (no lo borra: trazabilidad)
// =====================================================================
capturaRouter.delete(
  "/:id",
  requierePermiso("Captura", "EDITAR"),
  asyncHandler(async (req, res) => {
    const registro = await queryOne(
      "SELECT id_registro FROM registros_horarios WHERE id_registro = ?",
      [req.params.id],
    );
    if (!registro) throw ApiError.notFound();

    await execute("UPDATE registros_horarios SET estado = 'ANULADO' WHERE id_registro = ?", [
      req.params.id,
    ]);
    res.json({ anulado: true, id_registro: Number(req.params.id) });
  }),
);

// =====================================================================
// GET /captura/modulo/:id?fecha=
//   El tablero de un solo modulo: la hoja de calculo de la empresa, ya
//   cuadrada. Cabecera, una fila por franja con acumulados y dinero, y
//   la fila de totales del dia.
// =====================================================================
capturaRouter.get(
  "/modulo/:id",
  requierePermiso("Captura", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();

    const modulo = await queryOne(
      `SELECT id_modulo, codigo, nombre, ubicacion, capacidad_operarios,
              umbral_cumplimiento
       FROM modulos WHERE id_modulo = ?`,
      [req.params.id],
    );
    if (!modulo) throw ApiError.notFound("El modulo no existe");

    const jornada = await jornadaDeLaFecha(fecha);
    const orden = await ordenActivaDelModulo(req.params.id);

    const registros = await query(
      `SELECT * FROM vw_tablero_modulo_dia
       WHERE id_modulo = ? AND fecha = ? ORDER BY hora_jornada`,
      [req.params.id, fecha],
    );

    const totales = await queryOne(
      "SELECT * FROM vw_estado_modulo_dia WHERE id_modulo = ? AND fecha = ?",
      [req.params.id, fecha],
    );

    const porFranja = new Map(registros.map((registro) => [registro.hora_jornada, registro]));

    // Se devuelven TODAS las franjas del dia, con o sin captura: el hueco
    // en el tablero es informacion, no una fila que falta.
    const filas = jornada.franjas.map((franja) => ({
      ...franja,
      registro: porFranja.get(franja.orden_franja) ?? null,
    }));

    // Personas de referencia para la cabecera: lo ultimo capturado, y si
    // el dia no ha arrancado, la capacidad del modulo.
    const personas =
      registros.at(-1)?.personas_presentes ?? modulo.capacidad_operarios ?? 0;
    const sam = Number(registros.at(-1)?.sam_aplicado ?? orden?.sam_pactado ?? 0);
    const precio = Number(registros.at(-1)?.precio_aplicado ?? orden?.valor_maquila_unidad ?? 0);

    // La cabecera del tablero de pared. Todo esto se calcula: en la hoja
    // hay celdas que quedaron vacias (la meta del dia) y otras que dicen
    // "dia" pero traen una sola hora.
    const metaHoraPlena = sam > 0 ? (personas * 60) / sam : 0;
    const metaDia =
      sam > 0 ? jornada.franjas.reduce((t, f) => t + (personas * f.minutos) / sam, 0) : 0;

    res.json({
      fecha,
      modulo,
      jornada,
      orden,
      cabecera: {
        personas,
        sam,
        precio_unidad: precio,
        referencia: orden?.nombre_referencia ?? null,
        codigo_referencia: orden?.codigo_referencia ?? null,
        cliente: orden?.nombre_cliente ?? null,
        minutos_jornada: jornada.minutos_totales,
        horas_jornada: Number((jornada.minutos_totales / 60).toFixed(2)),
        meta_hora: Number(metaHoraPlena.toFixed(2)),
        meta_dia: Number(metaDia.toFixed(2)),
        facturacion_meta_hora: Number((metaHoraPlena * precio).toFixed(2)),
        facturacion_meta_dia: Number((metaDia * precio).toFixed(2)),
      },
      franjas: filas,
      totales: totales ?? null,
    });
  }),
);

// =====================================================================
// GET /captura/jornadas  -> el horario configurado de la planta
// =====================================================================
capturaRouter.get(
  "/jornadas",
  requierePermiso("Captura", "VER"),
  asyncHandler(async (_req, res) => {
    // Franjas y dias se agregan por separado: unir las dos tablas en el
    // mismo GROUP BY multiplica los minutos por la cantidad de dias.
    const jornadas = await query(
      `SELECT j.id_jornada, j.codigo, j.nombre, j.estado,
              COALESCE(f.franjas, 0)        AS franjas,
              COALESCE(f.minutos_totales, 0) AS minutos_totales,
              d.dias                        AS dias
       FROM jornadas j
       LEFT JOIN (
         SELECT id_jornada, COUNT(*) AS franjas, SUM(minutos) AS minutos_totales
         FROM jornada_franjas GROUP BY id_jornada
       ) f ON f.id_jornada = j.id_jornada
       LEFT JOIN (
         SELECT id_jornada, GROUP_CONCAT(dia_semana ORDER BY dia_semana) AS dias
         FROM jornada_dia GROUP BY id_jornada
       ) d ON d.id_jornada = j.id_jornada
       ORDER BY j.codigo`,
    );

    const franjas = await query(
      `SELECT id_franja, id_jornada, orden_franja, hora_inicio, hora_fin, minutos, etiqueta
       FROM jornada_franjas ORDER BY id_jornada, orden_franja`,
    );

    res.json(
      jornadas.map((jornada) => ({
        ...jornada,
        dias: String(jornada.dias || "").split(",").filter(Boolean).map(Number),
        franjas: franjas.filter((franja) => franja.id_jornada === jornada.id_jornada),
      })),
    );
  }),
);
