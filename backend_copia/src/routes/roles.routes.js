import { Router } from "express";
import { execute, query, queryOne, transaction } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { invalidarCachePermisos, requierePermiso } from "../middleware/auth.js";

export const rolesRouter = Router();

const SELECT_ROL = `
  SELECT r.*,
         (SELECT COUNT(*) FROM rol_permiso rp WHERE rp.id_rol = r.id_rol) AS total_permisos,
         (SELECT COUNT(*) FROM usuarios u WHERE u.id_rol = r.id_rol AND u.estado = 'ACTIVO') AS usuarios_activos
  FROM roles r
`;

rolesRouter.get(
  "/",
  requierePermiso("Roles", "VER"),
  asyncHandler(async (req, res) => {
    const termino = String(req.query.buscar || "").trim();
    const where = termino ? "WHERE r.nombre LIKE ? OR r.descripcion LIKE ?" : "";
    const valores = termino ? [`%${termino}%`, `%${termino}%`] : [];

    const datos = await query(`${SELECT_ROL} ${where} ORDER BY r.nombre`, valores);
    res.json({ datos, total: datos.length });
  }),
);

rolesRouter.get(
  "/:id",
  requierePermiso("Roles", "VER"),
  asyncHandler(async (req, res) => {
    const rol = await queryOne(`${SELECT_ROL} WHERE r.id_rol = ?`, [req.params.id]);
    if (!rol) throw ApiError.notFound();
    res.json(rol);
  }),
);

rolesRouter.post(
  "/",
  requierePermiso("Roles", "CREAR"),
  asyncHandler(async (req, res) => {
    const { nombre, descripcion = null, estado = "ACTIVO" } = req.body || {};
    if (!nombre) throw ApiError.badRequest("El nombre del rol es obligatorio");

    const resultado = await execute(
      "INSERT INTO roles (nombre, descripcion, estado) VALUES (?, ?, ?)",
      [nombre, descripcion, estado],
    );
    res.status(201).json(await queryOne(`${SELECT_ROL} WHERE r.id_rol = ?`, [resultado.insertId]));
  }),
);

rolesRouter.put(
  "/:id",
  requierePermiso("Roles", "EDITAR"),
  asyncHandler(async (req, res) => {
    const rol = await queryOne("SELECT * FROM roles WHERE id_rol = ?", [req.params.id]);
    if (!rol) throw ApiError.notFound();

    // Regla del alcance: no se modifica un rol asignado a usuarios activos.
    const enUso = await queryOne(
      "SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ? AND estado = 'ACTIVO'",
      [req.params.id],
    );
    if (enUso.total > 0 && req.body?.estado === "INACTIVO") {
      throw ApiError.conflict(
        `No se puede inactivar: hay ${enUso.total} usuario(s) activo(s) con este rol`,
      );
    }

    await execute("UPDATE roles SET nombre = ?, descripcion = ?, estado = ? WHERE id_rol = ?", [
      req.body?.nombre ?? rol.nombre,
      req.body?.descripcion ?? rol.descripcion,
      req.body?.estado ?? rol.estado,
      req.params.id,
    ]);

    res.json(await queryOne(`${SELECT_ROL} WHERE r.id_rol = ?`, [req.params.id]));
  }),
);

rolesRouter.delete(
  "/:id",
  requierePermiso("Roles", "ELIMINAR"),
  asyncHandler(async (req, res) => {
    const enUso = await queryOne("SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ?", [
      req.params.id,
    ]);
    if (enUso.total > 0) {
      throw ApiError.conflict(
        `No se puede eliminar: hay ${enUso.total} usuario(s) con este rol asignado`,
      );
    }

    const existente = await queryOne("SELECT id_rol FROM roles WHERE id_rol = ?", [req.params.id]);
    if (!existente) throw ApiError.notFound();

    await execute("DELETE FROM roles WHERE id_rol = ?", [req.params.id]);
    invalidarCachePermisos(req.params.id);
    res.json({ eliminado: true, id_rol: Number(req.params.id) });
  }),
);

// ---------------------------------------------------------------------
// GET /roles/:id/permisos  -> ids de `rol_permiso`
// ---------------------------------------------------------------------
rolesRouter.get(
  "/:id/permisos",
  requierePermiso("Permisos", "VER"),
  asyncHandler(async (req, res) => {
    const datos = await query(
      `SELECT p.id_permiso, p.modulo, p.accion
       FROM rol_permiso rp
       JOIN permisos p ON p.id_permiso = rp.id_permiso
       WHERE rp.id_rol = ?`,
      [req.params.id],
    );
    res.json({ id_rol: Number(req.params.id), permisos: datos });
  }),
);

// ---------------------------------------------------------------------
// PUT /roles/:id/permisos  -> reemplaza la matriz completa del rol
//   Acepta ids o pares { modulo, accion } (la clave natural de la tabla).
// ---------------------------------------------------------------------
rolesRouter.put(
  "/:id/permisos",
  requierePermiso("Permisos", "EDITAR"),
  asyncHandler(async (req, res) => {
    const rol = await queryOne("SELECT id_rol FROM roles WHERE id_rol = ?", [req.params.id]);
    if (!rol) throw ApiError.notFound("El rol no existe");

    const entrada = Array.isArray(req.body?.permisos) ? req.body.permisos : [];

    const ids = [];
    for (const item of entrada) {
      if (typeof item === "number") {
        ids.push(item);
        continue;
      }
      if (item?.id_permiso) {
        ids.push(Number(item.id_permiso));
        continue;
      }
      if (item?.modulo && item?.accion) {
        const permiso = await queryOne(
          "SELECT id_permiso FROM permisos WHERE modulo = ? AND accion = ?",
          [item.modulo, item.accion],
        );
        if (permiso) ids.push(permiso.id_permiso);
      }
    }

    const unicos = [...new Set(ids)];

    await transaction(async (conexion) => {
      await conexion.execute("DELETE FROM rol_permiso WHERE id_rol = ?", [req.params.id]);
      for (const idPermiso of unicos) {
        await conexion.execute(
          "INSERT IGNORE INTO rol_permiso (id_rol, id_permiso) VALUES (?, ?)",
          [req.params.id, idPermiso],
        );
      }
    });

    invalidarCachePermisos(req.params.id);
    res.json({ id_rol: Number(req.params.id), total_permisos: unicos.length });
  }),
);
