import { estaVacio } from "./formValidation";

/**
 * Reglas de contrasena.
 *
 * El minimo es el mismo que exige el backend (`auth.routes.js` y
 * `usuarios.routes.js`): 8 caracteres. Los demas requisitos se piden solo en
 * el frontend, como ayuda al usuario al elegir una clave.
 */
export const LARGO_MINIMO_CLAVE = 8;
export const LARGO_MAXIMO_CLAVE = 64;

/**
 * `opcional` sirve al editar un usuario: dejar el campo vacio significa
 * "no cambiar la contrasena", pero si escribe algo debe cumplir las reglas.
 */
export const clave =
  ({
    min = LARGO_MINIMO_CLAVE,
    max = LARGO_MAXIMO_CLAVE,
    opcional = false,
    exigeLetra = true,
    exigeNumero = true,
    exigeMayuscula = false,
    exigeEspecial = false,
  } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return opcional ? "" : "La contrasena es obligatoria";

    const texto = String(valor);
    if (texto.length < min) return `La contrasena requiere minimo ${min} caracteres`;
    if (texto.length > max) return `La contrasena admite maximo ${max} caracteres`;
    if (exigeLetra && !/[A-Za-z]/.test(texto)) return "La contrasena debe incluir al menos una letra";
    if (exigeNumero && !/\d/.test(texto)) return "La contrasena debe incluir al menos un numero";
    if (exigeMayuscula && !/[A-Z]/.test(texto)) return "La contrasena debe incluir una mayuscula";
    if (exigeEspecial && !/[^A-Za-z0-9]/.test(texto)) {
      return "La contrasena debe incluir un caracter especial";
    }

    return "";
  };

/** El campo de confirmacion debe coincidir exactamente con la contrasena. */
export const confirmacion =
  (campo = "clave", { opcional = false } = {}) =>
  (valor, form) => {
    const original = form?.[campo];
    if (estaVacio(original) && opcional) return "";
    if (estaVacio(valor)) return "Confirma la contrasena";

    return valor === original ? "" : "Las contrasenas no coinciden";
  };

/** Dos valores cualesquiera que deben ser iguales. */
export const igualA =
  (campo, mensaje = "Los valores no coinciden") =>
  (valor, form) =>
    valor === form?.[campo] ? "" : mensaje;
