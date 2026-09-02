import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de rol -> tabla `roles`.
 * Los limites siguen a la base: nombre VARCHAR(60) UNIQUE, descripcion VARCHAR(255).
 */
export const rolLimites = {
  nombre: { min: 3, max: 60 },
  descripcion: { max: 255 },
};

export const rolEstados = ["ACTIVO", "INACTIVO"];

/**
 * `lista` y `editing` llegan del listado en pantalla para poder avisar del
 * nombre repetido antes de que lo rechace la restriccion UNIQUE de MySQL.
 */
export function crearRolEsquema({ lista = [], editing = null } = {}) {
  return {
    nombre: [
      reglas.requerido("El nombre del rol"),
      reglas.longitud({ ...rolLimites.nombre, etiqueta: "El nombre del rol" }),
      reglas.sinCaracteresEspeciales("El nombre del rol"),
      reglas.unico({
        lista,
        campo: "nombre",
        idField: "id_rol",
        actual: editing,
        etiqueta: "Ese nombre de rol",
      }),
    ],
    descripcion: [reglas.longitud({ ...rolLimites.descripcion, etiqueta: "La descripcion" })],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(rolEstados, "El estado")],
  };
}

/** Un rol sin permisos no deja entrar a ningun modulo: se avisa, no se bloquea. */
export function avisoSinPermisos(seleccionados) {
  const cantidad = seleccionados instanceof Set ? seleccionados.size : 0;
  return cantidad === 0
    ? "El rol se guardara sin permisos: nadie con ese rol podra entrar a un modulo"
    : "";
}
