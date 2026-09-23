import { Router } from "express";
import bcrypt from "bcryptjs";
import { execute, query, queryOne } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { filtrosDeListado } from "../lib/filtros.js";
import { requierePermiso } from "../middleware/auth.js";

export const usuariosRouter = Router();

/** Nunca se devuelve `clave_hash` al cliente. */
const SELECT_USUARIO = `
  SELECT u.id_usuario, u.id_rol, u.tipo_documento, u.numero_documento, u.nombres,
         u.apellidos, u.correo, u.telefono, u.estado, u.intentos_fallidos,
         u.bloqueado_hasta, u.ultimo_acceso, u.fecha_creacion,
         r.nombre AS nombre_rol
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
`;

usuariosRouter.get(
  "/",
  requierePermiso("Usuarios", "VER"),
  asyncHandler(async (req, res) => {
    const { where, valores } = filtrosDeListado(req.query, {
      buscarEn: ["u.nombres", "u.apellidos", "u.correo", "u.numero_documento"],
      iguales: [
        { parametro: "estado", columna: "u.estado" },
        { parametro: "id_rol", columna: "u.id_rol" },
      ],
    });
    const datos = await query(`${SELECT_USUARIO} ${where} ORDER BY u.nombres, u.apellidos`, valores);
    res.json({ datos, total: datos.length });
  }),
);

usuariosRouter.get(
  "/:id",
  requierePermiso("Usuarios", "VER"),
  asyncHandler(async (req, res) => {
    const usuario = await queryOne(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, [req.params.id]);
    if (!usuario) throw ApiError.notFound();
    res.json(usuario);
  }),
);

usuariosRouter.post(
  "/",
  requierePermiso("Usuarios", "CREAR"),
  asyncHandler(async (req, res) => {
    const {
      id_rol, tipo_documento = "CC", numero_documento, nombres, apellidos,
      correo, telefono = null, clave, estado = "ACTIVO",
    } = req.body || {};

    if (!id_rol || !numero_documento || !nombres || !apellidos || !correo || !clave) {
      throw ApiError.badRequest(
        "id_rol, numero_documento, nombres, apellidos, correo y clave son obligatorios",
      );
    }
    if (String(clave).length < 8) {
      throw ApiError.badRequest("La contrasena debe tener al menos 8 caracteres");
    }

    const resultado = await execute(
      `INSERT INTO usuarios
         (id_rol, tipo_documento, numero_documento, nombres, apellidos, correo, telefono, clave_hash, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_rol, tipo_documento, numero_documento, nombres, apellidos,
        String(correo).toLowerCase(), telefono, await bcrypt.hash(String(clave), 10), estado,
      ],
    );

    res.status(201).json(
      await queryOne(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, [resultado.insertId]),
    );
  }),
);

usuariosRouter.put(
  "/:id",
  requierePermiso("Usuarios", "EDITAR"),
  asyncHandler(async (req, res) => {
    const existente = await queryOne("SELECT id_usuario FROM usuarios WHERE id_usuario = ?", [
      req.params.id,
    ]);
    if (!existente) throw ApiError.notFound();

    const campos = [
      "id_rol", "tipo_documento", "numero_documento", "nombres",
      "apellidos", "correo", "telefono", "estado",
    ];

    const columnas = [];
    const valores = [];

    campos.forEach((campo) => {
      if (req.body?.[campo] !== undefined) {
        columnas.push(`${campo} = ?`);
        valores.push(campo === "correo" ? String(req.body[campo]).toLowerCase() : req.body[campo]);
      }
    });

    // La contrasena solo se toca si viene: dejarla vacia no la borra.
    if (req.body?.clave) {
      if (String(req.body.clave).length < 8) {
        throw ApiError.badRequest("La contrasena debe tener al menos 8 caracteres");
      }
      columnas.push("clave_hash = ?");
      valores.push(await bcrypt.hash(String(req.body.clave), 10));
    }

    // Reactivar un usuario limpia el bloqueo por intentos fallidos.
    if (req.body?.estado === "ACTIVO") {
      columnas.push("intentos_fallidos = 0", "bloqueado_hasta = NULL");
    }

    if (columnas.length === 0) throw ApiError.badRequest("No se enviaron datos");

    await execute(`UPDATE usuarios SET ${columnas.join(", ")} WHERE id_usuario = ?`, [
      ...valores,
      req.params.id,
    ]);

    res.json(await queryOne(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, [req.params.id]));
  }),
);

usuariosRouter.delete(
  "/:id",
  requierePermiso("Usuarios", "ELIMINAR"),
  asyncHandler(async (req, res) => {
    if (Number(req.params.id) === Number(req.usuario.id_usuario)) {
      throw ApiError.badRequest("No puede inactivar su propio usuario");
    }

    const existente = await queryOne("SELECT id_usuario FROM usuarios WHERE id_usuario = ?", [
      req.params.id,
    ]);
    if (!existente) throw ApiError.notFound();

    // El alcance pide conservar trazabilidad: se inactiva, no se borra.
    await execute("UPDATE usuarios SET estado = 'INACTIVO' WHERE id_usuario = ?", [req.params.id]);
    res.json({ inactivado: true, id_usuario: Number(req.params.id) });
  }),
);
