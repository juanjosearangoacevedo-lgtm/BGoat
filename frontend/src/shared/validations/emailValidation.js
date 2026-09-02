import { estaVacio } from "./formValidation";

/**
 * Reglas de correo electronico.
 * Formato usuario@dominio.ext, sin espacios y dentro del largo de la columna
 * `correo` de la base (VARCHAR 120).
 */
const FORMATO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export const LARGO_MAXIMO_CORREO = 120;

export const correo =
  ({ mensaje = "Correo invalido (ejemplo: nombre@empresa.com)", max = LARGO_MAXIMO_CORREO } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";

    const texto = String(valor).trim();
    if (/\s/.test(String(valor))) return "El correo no puede contener espacios";
    if (!FORMATO.test(texto)) return mensaje;
    if (texto.length > max) return `El correo admite maximo ${max} caracteres`;

    return "";
  };

/** Comprobacion suelta, para usos donde no hay esquema (por ejemplo el login). */
export function esCorreoValido(valor) {
  return FORMATO.test(String(valor ?? "").trim());
}
