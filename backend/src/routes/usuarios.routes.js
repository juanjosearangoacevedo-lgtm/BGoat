import { Router } from "express";
import bcrypt from "bcryptjs";
import { execute, query, queryOne } from "../config/db.js";
import {
  exigirAdministradorRestante,
  exigirNoInactivarseASiMismo,
} from "../lib/administradores.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { filtrosDeListado } from "../lib/filtros.js";
import { prepararIdentidad } from "../lib/identidad.js";
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
      throw ApiError.badRequest("La contraseña debe tener al menos 8 caracteres");
    }

    // El documento se guarda sin puntos ni espacios y tiene que cumplir las
    // reglas de su tipo; el correo y el telefono tambien se revisan.
    const identidad = prepararIdentidad(
      { tipo_documento, numero_documento, correo, telefono },
      { tipoPorDefecto: "CC" },
    );

    const resultado = await execute(
      `INSERT INTO usuarios
         (id_rol, tipo_documento, numero_documento, nombres, apellidos, correo, telefono, clave_hash, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_rol, identidad.tipo_documento, identidad.numero_documento, nombres, apellidos,
        identidad.correo, identidad.telefono, await bcrypt.hash(String(clave), 10), estado,
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
    const existente = await queryOne(
      `SELECT id_usuario, id_rol, estado, tipo_documento, numero_documento, correo, telefono
         FROM usuarios WHERE id_usuario = ?`,
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    // El interruptor de estado de la pantalla pasa por aqui, y por aqui un
    // administrador se inactivaba a si mismo (o se cambiaba el rol) y dejaba
    // al sistema sin nadie que pudiera reactivarlo.
    exigirNoInactivarseASiMismo({
      idObjetivo: req.params.id,
      idSolicitante: req.usuario.id_usuario,
      estado: req.body?.estado,
    });
    await exigirAdministradorRestante(existente, {
      estado: req.body?.estado,
      id_rol: req.body?.id_rol,
    });

    const campos = [
      "id_rol", "tipo_documento", "numero_documento", "nombres",
      "apellidos", "correo", "telefono", "estado",
    ];

    const columnas = [];
    const valores = [];

    // Documento, correo y telefono: normalizados y validados solo si cambian
    // (un dato viejo que hoy no pasaria no impide, por ejemplo, reactivar).
    const identidad = prepararIdentidad(
      Object.fromEntries(
        ["tipo_documento", "numero_documento", "correo", "telefono"]
          .filter((campo) => req.body?.[campo] !== undefined)
          .map((campo) => [campo, req.body[campo]]),
      ),
      { existente, tipoPorDefecto: "CC" },
    );

    campos.forEach((campo) => {
      if (req.body?.[campo] !== undefined) {
        columnas.push(`${campo} = ?`);
        valores.push(campo in identidad ? identidad[campo] : req.body[campo]);
      }
    });

    // La contrasena solo se toca si viene: dejarla vacia no la borra.
    if (req.body?.clave) {
      if (String(req.body.clave).length < 8) {
        throw ApiError.badRequest("La contraseña debe tener al menos 8 caracteres");
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

// Antes de eliminar: dice si el sistema lo permite. Un usuario no esta
// "enlazado" a nada que lo detenga, pero hay dos reglas: nadie se inactiva a
// si mismo y el sistema no se queda sin administrador activo.
usuariosRouter.get(
  "/:id/enlaces",
  requierePermiso("Usuarios", "ELIMINAR"),
  asyncHandler(async (req, res) => {
    const existente = await queryOne(
      "SELECT id_usuario, id_rol, estado FROM usuarios WHERE id_usuario = ?",
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    const respuesta = {
      bloqueado: false, total: 0, mensaje: null, motivo: null, ayuda: null, enlaces: [],
      borra: false, yaInactivo: existente.estado === "INACTIVO",
    };

    try {
      exigirNoInactivarseASiMismo({
        idObjetivo: req.params.id,
        idSolicitante: req.usuario.id_usuario,
        estado: "INACTIVO",
      });
      await exigirAdministradorRestante(existente, { estado: "INACTIVO" });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 400) throw error;
      return res.json({ ...respuesta, bloqueado: true, mensaje: error.message, motivo: error.message });
    }

    return res.json(respuesta);
  }),
);

usuariosRouter.delete(
  "/:id",
  requierePermiso("Usuarios", "ELIMINAR"),
  asyncHandler(async (req, res) => {
    exigirNoInactivarseASiMismo({
      idObjetivo: req.params.id,
      idSolicitante: req.usuario.id_usuario,
      estado: "INACTIVO",
    });

    const existente = await queryOne(
      "SELECT id_usuario, id_rol, estado FROM usuarios WHERE id_usuario = ?",
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    await exigirAdministradorRestante(existente, { estado: "INACTIVO" });

    // El alcance pide conservar trazabilidad: se inactiva, no se borra.
    await execute("UPDATE usuarios SET estado = 'INACTIVO' WHERE id_usuario = ?", [req.params.id]);
    res.json({ inactivado: true, id_usuario: Number(req.params.id) });
  }),
);
