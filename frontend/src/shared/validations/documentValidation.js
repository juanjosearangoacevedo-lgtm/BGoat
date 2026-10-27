import { estaVacio } from "./formValidation";
import { digitoVerificacionNit, normalizarDocumento, validarDocumento } from "./documentRules";

/**
 * Regla y ayudas del numero de documento. La regla de fondo (que es valido
 * para cada tipo) vive en `documentRules.js`, igual a la del backend.
 *
 * Los formularios usan tres cosas:
 *   - `reglas.documento()`            -> la validacion, segun el tipo escogido;
 *   - `normalizarDocumento(tipo, v)`  -> al escribir: lo que el tipo no admite
 *                                         no aparece (letras en una cedula...);
 *   - `ejemploDocumento` y `pistaDocumento` -> el placeholder y el consejo.
 */
export { normalizarDocumento };

/**
 * Valida `form.numero_documento` contra `form.tipo_documento`.
 *
 * `actual` es el registro que se esta editando: si su documento no cambio se
 * deja pasar aunque hoy no cumpla la regla (un dato viejo, por ejemplo un NIT
 * con el digito de verificacion mal digitado, no debe impedir editar otra
 * cosa). Solo se juzga lo que el usuario toca.
 */
export const documento =
  ({ actual = null } = {}) =>
  (valor, form) => {
    if (estaVacio(valor)) return "";

    const igualAlGuardado =
      actual &&
      String(actual.tipo_documento ?? "") === String(form?.tipo_documento ?? "") &&
      String(actual.numero_documento ?? "") === String(valor).trim();
    if (igualAlGuardado) return "";

    return validarDocumento(form?.tipo_documento, valor);
  };

const EJEMPLOS = {
  CC: "1234567890",
  TI: "1000717474",
  CE: "1234567",
  NIT: "900123456-8",
  PASAPORTE: "AN123456",
  OTRO: "ABC12345",
};

/** Un numero de ejemplo para el placeholder, segun el tipo. */
export const ejemploDocumento = (tipo) => EJEMPLOS[tipo] ?? "";

/**
 * La regla de cada tipo dicha en una linea: es lo que va bajo el campo.
 *
 * No se corta el largo al escribir (ni con `maxLength`, que contaria los
 * puntos de "1.017.925.610" al pegar, ni recortando): un numero de mas se
 * deja ver y se marca como error, en vez de guardar uno distinto al pegado.
 */
const REGLA_EN_TEXTO = {
  CC: "De 6 a 10 dígitos, solo números.",
  TI: "10 u 11 dígitos, solo números.",
  CE: "De 5 a 10 dígitos, solo números.",
  NIT: "De 8 a 10 dígitos. El dígito de verificación (900123456-8) es opcional.",
  PASAPORTE: "De 5 a 15 letras o números, sin espacios.",
  OTRO: "De 5 a 15 letras o números, sin espacios.",
};

/**
 * Consejo bajo el campo: la regla del tipo escogido. Para un NIT escrito sin
 * digito de verificacion dice cual le corresponde, que es lo que mas se
 * olvida al digitarlo.
 */
export function pistaDocumento(tipo, valor) {
  if (tipo === "NIT") {
    const base = /^(\d{8,10})-?$/.exec(String(valor ?? "").trim());
    if (base) return `Con dígito de verificación: ${base[1]}-${digitoVerificacionNit(base[1])}`;
  }
  return REGLA_EN_TEXTO[tipo] ?? "";
}
