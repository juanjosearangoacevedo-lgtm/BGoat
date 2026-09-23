import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { execute, queryOne } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { firmarToken, permisosDelUsuario, requiereAuth } from "../middleware/auth.js";

export const authRouter = Router();

/** Deja rastro en `sesiones_acceso` (auditoria exigida en el alcance). */
async function registrarEvento(req, { idUsuario = null, correo, evento, detalle = null }) {
  await execute(
    `INSERT INTO sesiones_acceso
       (id_usuario, correo_intento, evento, direccion_ip, agente_usuario, detalle)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      idUsuario,
      correo || "desconocido",
      evento,
      (req.ip || "").slice(0, 45),
      (req.headers["user-agent"] || "").slice(0, 255),
      detalle,
    ],
  );
}

function usuarioPublico(usuario) {
  return {
    id_usuario: usuario.id_usuario,
    id_rol: usuario.id_rol,
    nombre_rol: usuario.nombre_rol,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    telefono: usuario.telefono,
    estado: usuario.estado,
    ultimo_acceso: usuario.ultimo_acceso,
  };
}

// ---------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const correo = String(req.body?.correo || "").trim().toLowerCase();
    const clave = String(req.body?.clave || "");

    if (!correo || !clave) throw ApiError.badRequest("Correo y contrasena son obligatorios");

    const usuario = await queryOne(
      `SELECT u.*, r.nombre AS nombre_rol
       FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.correo = ?`,
      [correo],
    );

    if (!usuario) {
      await registrarEvento(req, { correo, evento: "LOGIN_FALLIDO", detalle: "Correo inexistente" });
      throw ApiError.unauthorized("Credenciales incorrectas");
    }

    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      await registrarEvento(req, {
        idUsuario: usuario.id_usuario, correo, evento: "LOGIN_FALLIDO", detalle: "Cuenta bloqueada",
      });
      throw ApiError.forbidden(
        `Cuenta bloqueada temporalmente. Intente despues de ${usuario.bloqueado_hasta}`,
      );
    }

    if (usuario.estado === "INACTIVO") {
      await registrarEvento(req, {
        idUsuario: usuario.id_usuario, correo, evento: "LOGIN_FALLIDO", detalle: "Usuario inactivo",
      });
      throw ApiError.forbidden("El usuario esta inactivo. Contacte al administrador.");
    }

    const claveCorrecta = await bcrypt.compare(clave, usuario.clave_hash);

    if (!claveCorrecta) {
      const intentos = usuario.intentos_fallidos + 1;
      const debeBloquear = intentos >= env.seguridad.maxIntentos;

      await execute(
        `UPDATE usuarios
         SET intentos_fallidos = ?,
             bloqueado_hasta = ${debeBloquear ? "DATE_ADD(NOW(), INTERVAL ? MINUTE)" : "NULL"},
             estado = ?
         WHERE id_usuario = ?`,
        debeBloquear
          ? [intentos, env.seguridad.minutosBloqueo, "BLOQUEADO", usuario.id_usuario]
          : [intentos, usuario.estado === "BLOQUEADO" ? "ACTIVO" : usuario.estado, usuario.id_usuario],
      );

      await registrarEvento(req, {
        idUsuario: usuario.id_usuario,
        correo,
        evento: debeBloquear ? "BLOQUEO" : "LOGIN_FALLIDO",
        detalle: `Intento ${intentos} de ${env.seguridad.maxIntentos}`,
      });

      if (debeBloquear) {
        throw ApiError.forbidden(
          `Demasiados intentos fallidos. Cuenta bloqueada por ${env.seguridad.minutosBloqueo} minutos.`,
        );
      }
      throw ApiError.unauthorized("Credenciales incorrectas");
    }

    await execute(
      `UPDATE usuarios
       SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW(),
           estado = IF(estado = 'BLOQUEADO', 'ACTIVO', estado)
       WHERE id_usuario = ?`,
      [usuario.id_usuario],
    );

    await registrarEvento(req, { idUsuario: usuario.id_usuario, correo, evento: "LOGIN_EXITOSO" });

    res.json({
      token: firmarToken(usuario),
      usuario: usuarioPublico(usuario),
      permisos: await permisosDelUsuario(usuario.id_rol),
    });
  }),
);

// ---------------------------------------------------------------------
// GET /auth/perfil
// ---------------------------------------------------------------------
authRouter.get(
  "/perfil",
  requiereAuth,
  asyncHandler(async (req, res) => {
    const usuario = await queryOne(
      `SELECT u.*, r.nombre AS nombre_rol
       FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = ?`,
      [req.usuario.id_usuario],
    );
    if (!usuario) throw ApiError.unauthorized("El usuario ya no existe");

    res.json({
      usuario: usuarioPublico(usuario),
      permisos: await permisosDelUsuario(usuario.id_rol),
    });
  }),
);

// ---------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------
authRouter.post(
  "/logout",
  requiereAuth,
  asyncHandler(async (req, res) => {
    await registrarEvento(req, {
      idUsuario: req.usuario.id_usuario, correo: req.usuario.correo, evento: "LOGOUT",
    });
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------
// POST /auth/registro
// ---------------------------------------------------------------------
authRouter.post(
  "/registro",
  asyncHandler(async (req, res) => {
    const { nombres, apellidos, tipo_documento, numero_documento, correo, telefono, clave } = req.body || {};

    if (!nombres || !apellidos || !numero_documento || !correo || !clave) {
      throw ApiError.badRequest("Faltan datos obligatorios del registro");
    }
    if (String(clave).length < 8) {
      throw ApiError.badRequest("La contrasena debe tener al menos 8 caracteres");
    }

    const rol = await queryOne("SELECT id_rol FROM roles WHERE nombre = 'Operario' LIMIT 1");
    if (!rol) throw ApiError.conflict("No existe un rol base para asignar. Ejecute el seed.");

    const resultado = await execute(
      `INSERT INTO usuarios
         (id_rol, tipo_documento, numero_documento, nombres, apellidos, correo, telefono, clave_hash, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INACTIVO')`,
      [
        rol.id_rol,
        tipo_documento || "CC",
        numero_documento,
        nombres,
        apellidos,
        String(correo).toLowerCase(),
        telefono || null,
        await bcrypt.hash(String(clave), 10),
      ],
    );

    // Nace inactivo a proposito: un administrador le asigna rol y lo activa.
    res.status(201).json({
      id_usuario: resultado.insertId,
      mensaje: "Cuenta creada. Un administrador debe activarla y asignarle su rol.",
    });
  }),
);

// ---------------------------------------------------------------------
// POST /auth/recuperar
// ---------------------------------------------------------------------
authRouter.post(
  "/recuperar",
  asyncHandler(async (req, res) => {
    const correo = String(req.body?.correo || "").trim().toLowerCase();
    if (!correo) throw ApiError.badRequest("El correo es obligatorio");

    const usuario = await queryOne("SELECT id_usuario FROM usuarios WHERE correo = ?", [correo]);

    // Respuesta identica exista o no la cuenta: no se filtra quien esta registrado.
    if (usuario) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await execute(
        `INSERT INTO recuperacion_claves (id_usuario, token_hash, fecha_expiracion)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
        [usuario.id_usuario, tokenHash],
      );

      // Sin servicio de correo configurado, el token se entrega por consola.
      console.log(`[BGoat] Token de recuperacion para ${correo}: ${token}`);
    }

    res.json({ mensaje: "Si el correo existe, se enviaron las instrucciones de recuperacion." });
  }),
);

// ---------------------------------------------------------------------
// POST /auth/restablecer
// ---------------------------------------------------------------------
authRouter.post(
  "/restablecer",
  asyncHandler(async (req, res) => {
    const { token, clave } = req.body || {};
    if (!token || !clave) throw ApiError.badRequest("Token y contrasena son obligatorios");
    if (String(clave).length < 8) throw ApiError.badRequest("La contrasena debe tener al menos 8 caracteres");

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");

    const solicitud = await queryOne(
      `SELECT * FROM recuperacion_claves
       WHERE token_hash = ? AND estado = 'PENDIENTE' AND fecha_expiracion > NOW()`,
      [tokenHash],
    );
    if (!solicitud) throw ApiError.badRequest("El enlace de recuperacion no es valido o ya vencio");

    await execute(
      `UPDATE usuarios
       SET clave_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL,
           estado = IF(estado = 'BLOQUEADO', 'ACTIVO', estado)
       WHERE id_usuario = ?`,
      [await bcrypt.hash(String(clave), 10), solicitud.id_usuario],
    );

    await execute(
      "UPDATE recuperacion_claves SET estado = 'UTILIZADO', fecha_uso = NOW() WHERE id_recuperacion = ?",
      [solicitud.id_recuperacion],
    );

    await registrarEvento(req, {
      idUsuario: solicitud.id_usuario, correo: "", evento: "CAMBIO_CLAVE",
    });

    res.json({ mensaje: "Contrasena actualizada correctamente" });
  }),
);
