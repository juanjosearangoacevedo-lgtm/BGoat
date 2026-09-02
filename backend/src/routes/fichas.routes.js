import { Router } from "express";
import { execute, query, queryOne } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requierePermiso } from "../middleware/auth.js";

/**
 * Sub-recursos de una ficha tecnica: operaciones, materiales y medidas.
 * Se montan ANTES del CRUD generico de /fichas-tecnicas para que las rutas
 * con sufijo tengan prioridad sobre /:id.
 */
export const fichasHijasRouter = Router();

const hijos = {
  operaciones: {
    tabla: "ficha_tecnica_operaciones",
    pk: "id_operacion",
    campos: ["numero_operacion", "nombre_operacion", "descripcion", "maquina_requerida", "tiempo_estandar_minutos"],
    obligatorios: ["numero_operacion", "nombre_operacion"],
    orden: "numero_operacion ASC",
    select: "SELECT * FROM ficha_tecnica_operaciones",
  },
  materiales: {
    tabla: "ficha_tecnica_materiales",
    pk: "id_material",
    campos: ["nombre", "tipo", "descripcion", "cantidad_por_prenda", "unidad_medida", "obligatorio"],
    obligatorios: ["nombre"],
    orden: "tipo ASC, nombre ASC",
    select: "SELECT * FROM ficha_tecnica_materiales",
  },
  medidas: {
    tabla: "ficha_tecnica_medidas",
    pk: "id_medida",
    campos: ["id_talla", "punto_medida", "valor_cm", "tolerancia_cm"],
    obligatorios: ["id_talla", "punto_medida", "valor_cm"],
    orden: "punto_medida ASC",
    select: `SELECT m.*, t.nombre AS nombre_talla
             FROM ficha_tecnica_medidas m JOIN tallas t ON t.id_talla = m.id_talla`,
  },
};

Object.entries(hijos).forEach(([ruta, definicion]) => {
  const alias = ruta === "medidas" ? "m." : "";

  fichasHijasRouter.get(
    `/:idFicha/${ruta}`,
    requierePermiso("Fichas Tecnicas", "VER"),
    asyncHandler(async (req, res) => {
      const datos = await query(
        `${definicion.select} WHERE ${alias}id_ficha_tecnica = ? ORDER BY ${definicion.orden}`,
        [req.params.idFicha],
      );
      res.json({ datos, total: datos.length });
    }),
  );

  fichasHijasRouter.post(
    `/:idFicha/${ruta}`,
    requierePermiso("Fichas Tecnicas", "CREAR"),
    asyncHandler(async (req, res) => {
      const ficha = await queryOne(
        "SELECT id_ficha_tecnica FROM fichas_tecnicas WHERE id_ficha_tecnica = ?",
        [req.params.idFicha],
      );
      if (!ficha) throw ApiError.notFound("La ficha tecnica no existe");

      const datos = { id_ficha_tecnica: req.params.idFicha };
      definicion.campos.forEach((campo) => {
        if (req.body?.[campo] !== undefined && req.body[campo] !== "") datos[campo] = req.body[campo];
      });

      const faltantes = definicion.obligatorios.filter((campo) => datos[campo] === undefined);
      if (faltantes.length > 0) {
        throw ApiError.badRequest(`Faltan campos obligatorios: ${faltantes.join(", ")}`);
      }

      const columnas = Object.keys(datos);
      const resultado = await execute(
        `INSERT INTO ${definicion.tabla} (${columnas.join(", ")})
         VALUES (${columnas.map(() => "?").join(", ")})`,
        columnas.map((columna) => datos[columna]),
      );

      res.status(201).json(
        await queryOne(`SELECT * FROM ${definicion.tabla} WHERE ${definicion.pk} = ?`, [
          resultado.insertId,
        ]),
      );
    }),
  );

  fichasHijasRouter.delete(
    `/:idFicha/${ruta}/:id`,
    requierePermiso("Fichas Tecnicas", "ELIMINAR"),
    asyncHandler(async (req, res) => {
      await execute(
        `DELETE FROM ${definicion.tabla} WHERE ${definicion.pk} = ? AND id_ficha_tecnica = ?`,
        [req.params.id, req.params.idFicha],
      );
      res.status(204).send();
    }),
  );
});
