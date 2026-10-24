import { queryOne } from "../config/db.js";
import { ApiError } from "./http.js";

/**
 * El sistema nunca puede quedarse sin quien administre usuarios.
 *
 * "Administrador" no es el nombre de un rol: es quien puede editar usuarios
 * (`Usuarios` + `EDITAR`), porque eso es lo que hace falta para volver a
 * activar a alguien. Un rol llamado "Supervisor" con ese permiso cuenta; uno
 * llamado "Administrador" sin el, no.
 *
 * Sin esta guarda, el interruptor de estado de la pantalla de usuarios (que
 * va por `PUT /usuarios/:id`) dejaba a un administrador inactivarse a si
 * mismo, o cambiarse el rol, y con el unico administrador fuera nadie podia
 * entrar a reactivarlo: solo quedaba arreglarlo a mano en la base de datos.
 */
export const CAPACIDAD_ADMIN = { modulo: "Usuarios", accion: "EDITAR" };

/** Si ese rol puede administrar usuarios. */
async function rolPuedeAdministrar(idRol) {
  const fila = await queryOne(
    `SELECT 1 AS puede
       FROM rol_permiso rp
       JOIN permisos p ON p.id_permiso = rp.id_permiso
      WHERE rp.id_rol = ? AND p.modulo = ? AND p.accion = ? AND p.estado = 'ACTIVO'
      LIMIT 1`,
    [idRol, CAPACIDAD_ADMIN.modulo, CAPACIDAD_ADMIN.accion],
  );
  return Boolean(fila);
}

/** Cuantos usuarios ACTIVOS, sin contar a `idUsuario`, pueden administrar usuarios. */
async function otrosAdministradoresActivos(idUsuario) {
  const fila = await queryOne(
    `SELECT COUNT(DISTINCT u.id_usuario) AS total
       FROM usuarios u
       JOIN rol_permiso rp ON rp.id_rol = u.id_rol
       JOIN permisos p ON p.id_permiso = rp.id_permiso
      WHERE u.estado = 'ACTIVO' AND u.id_usuario <> ?
        AND p.modulo = ? AND p.accion = ? AND p.estado = 'ACTIVO'`,
    [idUsuario, CAPACIDAD_ADMIN.modulo, CAPACIDAD_ADMIN.accion],
  );
  return Number(fila?.total ?? 0);
}

const consultasDeBase = { rolPuedeAdministrar, otrosAdministradoresActivos };

/**
 * Nadie se inactiva a si mismo. El DELETE ya lo exigia; el PUT (el interruptor
 * de estado de la pantalla) no, y por ahi fue como un administrador se dejo
 * fuera. Reactivarse (`ACTIVO`) si se permite.
 */
export function exigirNoInactivarseASiMismo({ idObjetivo, idSolicitante, estado }) {
  if (estado === undefined || estado === "ACTIVO") return;
  if (Number(idObjetivo) === Number(idSolicitante)) {
    throw ApiError.badRequest("No puede inactivar su propio usuario");
  }
}

/**
 * Rechaza un cambio que dejaria al sistema sin administrador activo: inactivar
 * (o bloquear) al ultimo, o quitarle el rol con el que administra.
 *
 * `actual` es la fila del usuario antes del cambio (`id_usuario`, `id_rol`,
 * `estado`); `cambios` trae solo lo que se va a modificar. Solo se mira cuando
 * el usuario HOY administra y despues dejaria de poder: editar a quien no
 * administra, o dejar a un administrador con el mismo poder, no se toca. Si
 * queda otro administrador activo, el cambio pasa.
 *
 * `consultas` existe para probar la decision sin base de datos.
 */
export async function exigirAdministradorRestante(actual, cambios = {}, consultas = consultasDeBase) {
  const estado = cambios.estado ?? actual.estado;
  const idRol = cambios.id_rol ?? actual.id_rol;

  const eraAdministrador =
    actual.estado === "ACTIVO" && (await consultas.rolPuedeAdministrar(actual.id_rol));
  if (!eraAdministrador) return;

  const seguiraSiendoAdministrador =
    estado === "ACTIVO" && (await consultas.rolPuedeAdministrar(idRol));
  if (seguiraSiendoAdministrador) return;

  if ((await consultas.otrosAdministradoresActivos(actual.id_usuario)) === 0) {
    throw ApiError.badRequest(
      estado === "ACTIVO"
        ? "No se puede quitar el rol de administrador al último administrador activo: el sistema se quedaría sin quien pueda activar usuarios."
        : "No se puede inactivar al último administrador activo: el sistema se quedaría sin quien pueda activar usuarios.",
    );
  }
}
