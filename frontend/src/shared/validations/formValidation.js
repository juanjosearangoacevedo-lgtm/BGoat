/**
 * Motor de validacion de formularios.
 *
 * Una regla es una funcion `(valor, form) => mensaje | ""`.
 * Un esquema es `{ campo: [regla, regla] }`.
 *
 * `validarFormulario` corre el esquema y devuelve `{ campo: "mensaje" }` con
 * solo el primer error de cada campo, que es lo que pinta `FormField`.
 *
 * Este archivo no conoce ningun campo del negocio: las reglas concretas viven
 * en los otros archivos de `shared/validations/` y los esquemas de cada
 * modulo en `features/<modulo>/validations/`.
 */

/** Un campo con solo espacios cuenta como vacio. */
export function estaVacio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === "";
}

/**
 * Concordancia de genero y numero del mensaje con la etiqueta del campo.
 *
 * Las etiquetas llegan con articulo ("Los apellidos", "La fecha de ingreso"),
 * asi que el mensaje tiene que acompanarlas: "Los apellidos son obligatorios",
 * no "Los apellidos es obligatorio".
 */
export function concordar(etiqueta, { singular, plural, femenino, femeninoPlural }) {
  const texto = String(etiqueta).trim();

  if (/^los\s/i.test(texto)) return `${texto} ${plural}`;
  if (/^las\s/i.test(texto)) return `${texto} ${femeninoPlural}`;
  if (/^la\s/i.test(texto)) return `${texto} ${femenino}`;
  return `${texto} ${singular}`;
}

/** Corre el esquema y devuelve el primer error de cada campo. */
export function validarFormulario(form = {}, esquema = {}) {
  const errores = {};

  Object.entries(esquema).forEach(([campo, lista]) => {
    for (const regla of [].concat(lista || [])) {
      if (typeof regla !== "function") continue;
      const mensaje = regla(form[campo], form);
      if (mensaje) {
        errores[campo] = mensaje;
        break;
      }
    }
  });

  return errores;
}

/** true cuando el formulario no tiene ningun error. */
export function esValido(form, esquema) {
  return Object.keys(validarFormulario(form, esquema)).length === 0;
}

/**
 * Une varios esquemas concatenando las reglas del mismo campo.
 * Sirve para reutilizar un bloque comun (por ejemplo los datos de contacto)
 * en varios formularios sin repetirlo.
 */
export function combinarEsquemas(...esquemas) {
  return esquemas.filter(Boolean).reduce((resultado, esquema) => {
    Object.entries(esquema).forEach(([campo, reglas]) => {
      resultado[campo] = [...(resultado[campo] || []), ...[].concat(reglas)];
    });
    return resultado;
  }, {});
}
