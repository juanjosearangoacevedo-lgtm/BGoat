import { Router } from "express";
import { execute, query, queryOne } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { filtrosDeListado } from "../lib/filtros.js";
import { requierePermiso } from "../middleware/auth.js";

export const ordenesRouter = Router();

/**
 * Orden de produccion: el compromiso sobre un lote.
 *
 * NO NOMBRA MODULO. Nace libre y espera en el tablero a que un modulo la
 * tome, y eso pasa en un solo sitio: al abrir la jornada. `id_modulo` y
 * `codigo_modulo` siguen apareciendo en el listado porque `vw_avance_orden`
 * los deduce de quien la tomo, pero no se pueden escribir desde aqui.
 *
 * Ya no lleva ficha tecnica ni pedido. La ficha vive dentro del lote
 * (con su SAM y su imagen) y el pedido dejo de existir; lo unico que la
 * orden aporta al calculo de la hora es `valor_maquila_unidad`.
 *
 * Tampoco lleva detalle por prenda: la produccion se mide por lote, no
 * por talla y color, que es como se mide en planta.
 */
const CAMPOS = [
  "numero_orden", "id_lote",
  "fecha_inicio_programada", "fecha_fin_programada", "cantidad_programada",
  "valor_maquila_unidad", "prioridad", "estado", "observaciones",
];

const limpiar = (cuerpo = {}) => {
  const datos = {};
  CAMPOS.forEach((campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
      datos[campo] = cuerpo[campo] === "" ? null : cuerpo[campo];
    }
  });
  return datos;
};

// --- Listado (vista con el avance real) --------------------------------
ordenesRouter.get(
  "/",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    // `id_modulo` filtra por el modulo que la TOMO, que es lo que la
    // vista calcula; `asignacion` separa las libres de las tomadas.
    const { where, valores } = filtrosDeListado(req.query, {
      buscarEn: [
        "numero_orden", "codigo_lote", "nombre_cliente",
        "codigo_referencia", "codigo_modulo",
      ],
      iguales: ["estado", "id_modulo", "id_cliente", "id_lote", "prioridad", "asignacion"],
    });
    const datos = await query(
      `SELECT * FROM vw_avance_orden ${where} ORDER BY fecha_emision DESC`,
      valores,
    );
    res.json({ datos, total: datos.length });
  }),
);

// --- Detalle completo --------------------------------------------------
ordenesRouter.get(
  "/:id",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    const orden = await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [
      req.params.id,
    ]);
    if (!orden) throw ApiError.notFound();

    const [registros, jornadas] = await Promise.all([
      query(
        `SELECT * FROM vw_registro_horario
         WHERE id_orden_produccion = ?
         ORDER BY fecha DESC, hora_jornada DESC
         LIMIT 60`,
        [req.params.id],
      ),
      // Los dias que la digitadora trabajo esta orden, con su nomina.
      query(
        `SELECT jm.id_jornada_modulo, jm.fecha, jm.cantidad_operarias, jm.estado,
                COUNT(jo.id_jornada_operaria) AS operarias_identificadas
         FROM jornada_modulo jm
         LEFT JOIN jornada_operaria jo ON jo.id_jornada_modulo = jm.id_jornada_modulo
                                      AND jo.id_operario IS NOT NULL
         WHERE jm.id_orden_produccion = ?
         GROUP BY jm.id_jornada_modulo, jm.fecha, jm.cantidad_operarias, jm.estado
         ORDER BY jm.fecha DESC`,
        [req.params.id],
      ),
    ]);

    res.json({ ...orden, registros, jornadas });
  }),
);

// --- Crear -------------------------------------------------------------
ordenesRouter.post(
  "/",
  requierePermiso("Ordenes", "CREAR"),
  asyncHandler(async (req, res) => {
    const datos = limpiar(req.body);

    const faltantes = ["numero_orden", "id_lote", "cantidad_programada"]
      .filter((campo) => !datos[campo]);
    if (faltantes.length > 0) {
      throw ApiError.badRequest(`Faltan campos obligatorios: ${faltantes.join(", ")}`);
    }

    // `creado_por` sale de la sesion, no del formulario.
    datos.creado_por = req.usuario.id_usuario;

    const columnas = Object.keys(datos);
    const resultado = await execute(
      `INSERT INTO ordenes_produccion (${columnas.join(", ")})
       VALUES (${columnas.map(() => "?").join(", ")})`,
      columnas.map((columna) => datos[columna]),
    );

    // Si hay UNA sola jornada abierta corriendo ese lote sin orden, la
    // orden recien creada es la que le faltaba para poder facturar y se
    // la queda. Con dos o mas no se adivina: la orden se queda libre y la
    // toma quien corresponda al abrir la jornada.
    const huerfanas = await query(
      `SELECT id_jornada_modulo FROM jornada_modulo
        WHERE id_lote = ? AND id_orden_produccion IS NULL AND estado = 'ABIERTA'`,
      [datos.id_lote],
    );

    if (huerfanas.length === 1) {
      await execute("UPDATE jornada_modulo SET id_orden_produccion = ? WHERE id_jornada_modulo = ?", [
        resultado.insertId,
        huerfanas[0].id_jornada_modulo,
      ]);
    }

    res.status(201).json(
      await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [
        resultado.insertId,
      ]),
    );
  }),
);

// --- Actualizar --------------------------------------------------------
ordenesRouter.put(
  "/:id",
  requierePermiso("Ordenes", "EDITAR"),
  asyncHandler(async (req, res) => {
    const existente = await queryOne(
      "SELECT id_orden_produccion FROM ordenes_produccion WHERE id_orden_produccion = ?",
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    const datos = limpiar(req.body);
    const columnas = Object.keys(datos);

    if (columnas.length > 0) {
      await execute(
        `UPDATE ordenes_produccion SET ${columnas.map((c) => `${c} = ?`).join(", ")}
         WHERE id_orden_produccion = ?`,
        [...columnas.map((columna) => datos[columna]), req.params.id],
      );
    }

    res.json(
      await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [req.params.id]),
    );
  }),
);

// --- Eliminar ----------------------------------------------------------
ordenesRouter.delete(
  "/:id",
  requierePermiso("Ordenes", "ELIMINAR"),
  asyncHandler(async (req, res) => {
    const conProduccion = await queryOne(
      `SELECT COUNT(*) AS total FROM registros_horarios
       WHERE id_orden_produccion = ? AND estado <> 'ANULADO'`,
      [req.params.id],
    );

    // Regla del alcance: no se elimina una orden con produccion registrada.
    if (conProduccion.total > 0) {
      throw ApiError.conflict(
        `No se puede eliminar: la orden tiene ${conProduccion.total} registro(s) de produccion. ` +
          "Cancelela en lugar de eliminarla.",
      );
    }

    const enJornada = await queryOne(
      "SELECT COUNT(*) AS total FROM jornada_modulo WHERE id_orden_produccion = ?",
      [req.params.id],
    );
    if (enJornada.total > 0) {
      throw ApiError.conflict(
        "No se puede eliminar: hay jornadas configuradas con esta orden. Cancelela en lugar de eliminarla.",
      );
    }

    const existente = await queryOne(
      "SELECT id_orden_produccion FROM ordenes_produccion WHERE id_orden_produccion = ?",
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    await execute("DELETE FROM ordenes_produccion WHERE id_orden_produccion = ?", [req.params.id]);
    res.json({ eliminado: true, id_orden_produccion: Number(req.params.id) });
  }),
);

// --- Curva de arranque de la orden -------------------------------------
ordenesRouter.get(
  "/:id/curva",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    res.json({
      datos: await query(
        `SELECT hora_desde_inicio, fecha, hora_jornada, unidades_producidas, eficiencia, codigo_causa
         FROM vw_curva_arranque WHERE id_orden_produccion = ? ORDER BY hora_desde_inicio`,
        [req.params.id],
      ),
    });
  }),
);
