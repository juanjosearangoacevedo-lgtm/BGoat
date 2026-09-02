import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";

/**
 * Cache de permisos por rol.
 * Se invalida cuando el modulo de Permisos guarda cambios.
 */
const cachePermisos = new Map();

export function invalidarCachePermisos(idRol = null) {
  if (idRol === null) cachePermisos.clear();
  else cachePermisos.delete(String(idRol));
}

async function permisosDeRol(idRol) {
  const clave = String(idRol);
  if (cachePermisos.has(clave)) return cachePermisos.get(clave);

  const filas = await query(
    `SELECT p.modulo, p.accion
     FROM rol_permiso rp
     JOIN permisos p ON p.id_permiso = rp.id_permiso
     WHERE rp.id_rol = ? AND p.estado = 'ACTIVO'`,
    [idRol],
  );

  const conjunto = new Set(filas.map((fila) => `${fila.modulo}|${fila.accion}`));
  cachePermisos.set(clave, conjunto);
  return conjunto;
}

export function firmarToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol,
      correo: usuario.correo,
      nombre: `${usuario.nombres} ${usuario.apellidos}`,
    },
    env.jwt.secreto,
    { expiresIn: env.jwt.expiracion },
  );
}

/** Exige un token valido y deja al usuario en req.usuario. */
export const requiereAuth = asyncHandler(async (req, _res, next) => {
  const cabecera = req.headers.authorization || "";
  const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : null;

  if (!token) throw ApiError.unauthorized("Falta el token de acceso");

  try {
    req.usuario = jwt.verify(token, env.jwt.secreto);
  } catch {
    throw ApiError.unauthorized("Sesion expirada o token invalido");
  }

  next();
});

/**
 * Exige un permiso concreto (modulo + accion) sobre la tabla `permisos`.
 * Se usa en cada ruta CRUD a traves de `crudRouter`.
 */
export function requierePermiso(modulo, accion) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.usuario) throw ApiError.unauthorized();

    const permisos = await permisosDeRol(req.usuario.id_rol);
    if (!permisos.has(`${modulo}|${accion}`)) {
      throw ApiError.forbidden(`Su rol no tiene el permiso ${modulo} / ${accion}`);
    }

    next();
  });
}

/** Devuelve la lista de permisos del usuario autenticado (para el front). */
export async function permisosDelUsuario(idRol) {
  const conjunto = await permisosDeRol(idRol);
  return Array.from(conjunto).map((clave) => {
    const [modulo, accion] = clave.split("|");
    return { modulo, accion };
  });
}
