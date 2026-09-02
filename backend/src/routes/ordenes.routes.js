import { Router } from "express";
import { execute, query, queryOne, transaction } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requierePermiso } from "../middleware/auth.js";

export const ordenesRouter = Router();

const CAMPOS = [
  "numero_orden", "id_pedido", "id_lote", "id_modulo", "id_ficha_tecnica",
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

async function guardarDetalle(conexion, idOrden, detalle = []) {
  await conexion.execute("DELETE FROM detalle_orden_produccion WHERE id_orden_produccion = ?", [
    idOrden,
  ]);

  for (const linea of detalle) {
    if (!linea?.id_prenda) continue;
    await conexion.execute(
      `INSERT INTO detalle_orden_produccion
         (id_orden_produccion, id_prenda, cantidad_programada, observaciones)
       VALUES (?, ?, ?, ?)`,
      [idOrden, linea.id_prenda, Number(linea.cantidad_programada || 0), linea.observaciones || null],
    );
  }
}

// --- Listado (vista con el avance real) --------------------------------
ordenesRouter.get(
  "/",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    const condiciones = [];
    const valores = [];

    const termino = String(req.query.buscar || "").trim();
    if (termino) {
      condiciones.push(
        `(numero_orden LIKE ? OR codigo_lote LIKE ? OR nombre_cliente LIKE ?
          OR codigo_referencia LIKE ? OR codigo_modulo LIKE ?)`,
      );
      for (let i = 0; i < 5; i += 1) valores.push(`%${termino}%`);
    }
    ["estado", "id_modulo", "id_marca", "prioridad"].forEach((campo) => {
      const valor = req.query[campo];
      if (valor && valor !== "all" && valor !== "todos") {
        condiciones.push(`${campo} = ?`);
        valores.push(valor);
      }
    });

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
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

    const [detalle, materiales, registros] = await Promise.all([
      query(
        `SELECT d.*, p.sku, p.nombre AS nombre_prenda, t.nombre AS nombre_talla,
                c.nombre AS nombre_color
         FROM detalle_orden_produccion d
         JOIN prendas p ON p.id_prenda = d.id_prenda
         JOIN tallas t ON t.id_talla = p.id_talla
         JOIN colores c ON c.id_color = p.id_color
         WHERE d.id_orden_produccion = ?`,
        [req.params.id],
      ),
      query(
        `SELECT fm.* FROM ficha_tecnica_materiales fm
         JOIN ordenes_produccion o ON o.id_ficha_tecnica = fm.id_ficha_tecnica
         WHERE o.id_orden_produccion = ?`,
        [req.params.id],
      ),
      query(
        `SELECT * FROM vw_registro_horario
         WHERE id_orden_produccion = ?
         ORDER BY fecha DESC, hora_jornada DESC
         LIMIT 60`,
        [req.params.id],
      ),
    ]);

    res.json({ ...orden, detalle, materiales, registros });
  }),
);

// --- Crear -------------------------------------------------------------
ordenesRouter.post(
  "/",
  requierePermiso("Ordenes", "CREAR"),
  asyncHandler(async (req, res) => {
    const datos = limpiar(req.body);

    const faltantes = ["numero_orden", "id_lote", "id_modulo", "id_ficha_tecnica", "cantidad_programada"]
      .filter((campo) => !datos[campo]);
    if (faltantes.length > 0) {
      throw ApiError.badRequest(`Faltan campos obligatorios: ${faltantes.join(", ")}`);
    }

    // `creado_por` sale de la sesion, no del formulario.
    datos.creado_por = req.usuario.id_usuario;

    const columnas = Object.keys(datos);
    const idOrden = await transaction(async (conexion) => {
      const [resultado] = await conexion.execute(
        `INSERT INTO ordenes_produccion (${columnas.join(", ")})
         VALUES (${columnas.map(() => "?").join(", ")})`,
        columnas.map((columna) => datos[columna]),
      );
      await guardarDetalle(conexion, resultado.insertId, req.body?.detalle);
      return resultado.insertId;
    });

    res.status(201).json(
      await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [idOrden]),
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

    await transaction(async (conexion) => {
      if (columnas.length > 0) {
        await conexion.execute(
          `UPDATE ordenes_produccion SET ${columnas.map((c) => `${c} = ?`).join(", ")}
           WHERE id_orden_produccion = ?`,
          [...columnas.map((columna) => datos[columna]), req.params.id],
        );
      }
      if (Array.isArray(req.body?.detalle)) {
        await guardarDetalle(conexion, req.params.id, req.body.detalle);
      }
    });

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
