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
 * Consejo bajo el campo. Para un NIT escrito sin digito de verificacion dice
 * cual le corresponde, que es lo que mas se olvida al digitarlo.
 */
export function pistaDocumento(tipo, valor) {
  if (tipo !== "NIT") return "";

  const base = /^(\d{8,10})-?$/.exec(String(valor ?? "").trim());
  if (base) return `Con dígito de verificación: ${base[1]}-${digitoVerificacionNit(base[1])}`;

  return "Sin puntos. El dígito de verificación va tras un guion (900123456-8) y es opcional.";
}
