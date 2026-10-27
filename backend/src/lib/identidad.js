import { ApiError } from "./http.js";
import { TIPOS_DOCUMENTO, limpiarFormato, validarDocumento } from "./documentos.js";

/**
 * Los datos de identidad y contacto de una persona o empresa (documento,
 * correo, telefono): se dejan en su forma normal y se rechaza lo que no es
 * valido. Hasta ahora solo la pantalla lo revisaba; la API aceptaba cualquier
 * texto en el numero de documento.
 *
 * Las reglas del correo y del telefono son las mismas de
 * `frontend/src/shared/validations/` (emailValidation y numberValidation).
 */
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const LARGO_MAXIMO_CORREO = 120;
const TELEFONO_PERMITIDO = /^[\d\s()+-]+$/;
const DIGITOS_TELEFONO = { min: 7, max: 15 };

/** Mensaje de lo que esta mal en el correo, o "" si esta bien o vacio. */
export function validarCorreo(valor) {
  const texto = valor === undefined || valor === null ? "" : String(valor).trim();
  if (texto === "") return "";
  if (/\s/.test(texto)) return "El correo no puede contener espacios";
  if (!FORMATO_CORREO.test(texto)) return "Correo inválido (ejemplo: nombre@empresa.com)";
  if (texto.length > LARGO_MAXIMO_CORREO) return `El correo admite máximo ${LARGO_MAXIMO_CORREO} caracteres`;
  return "";
}

/** Mensaje de lo que esta mal en el telefono, o "" si esta bien o vacio. */
export function validarTelefono(valor) {
  const texto = valor === undefined || valor === null ? "" : String(valor).trim();
  if (texto === "") return "";
  if (/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(texto)) return "El teléfono no puede contener letras";
  if (!TELEFONO_PERMITIDO.test(texto)) return "El teléfono tiene caracteres no permitidos";

  const digitos = texto.replace(/\D/g, "").length;
  if (digitos < DIGITOS_TELEFONO.min) return `El teléfono requiere al menos ${DIGITOS_TELEFONO.min} dígitos`;
  if (digitos > DIGITOS_TELEFONO.max) return `El teléfono admite máximo ${DIGITOS_TELEFONO.max} dígitos`;
  return "";
}

const texto = (valor) => String(valor ?? "");

/**
 * Normaliza y valida el documento, el correo y el telefono de `datos`
 * (los campos que no vengan no se tocan) y devuelve los datos listos.
 *
 * `existente` es lo que hay guardado cuando se edita. Lo que NO cambio no se
 * vuelve a juzgar: si no, un dato viejo que hoy no pasaria las reglas (un NIT
 * con el digito de verificacion mal, por ejemplo) impediria hasta reactivar
 * el registro, porque el interruptor de estado reenvia la fila completa.
 *
 * `tiposValidos` son los tipos de documento que acepta la tabla;
 * `tipoPorDefecto` el que se asume si no se envia ninguno.
 */
export function prepararIdentidad(
  datos,
  { existente = null, tiposValidos = TIPOS_DOCUMENTO, tipoPorDefecto = "CC" } = {},
) {
  const listo = { ...datos };

  if (listo.tipo_documento !== undefined && listo.tipo_documento !== null) {
    if (!tiposValidos.includes(listo.tipo_documento)) {
      throw ApiError.badRequest(
        `El tipo de documento no es válido. Use uno de: ${tiposValidos.join(", ")}`,
      );
    }
  }

  const tipo = listo.tipo_documento ?? existente?.tipo_documento ?? tipoPorDefecto;
  const traeNumero = listo.numero_documento !== undefined && listo.numero_documento !== null;
  // Solo se le quita el formato ("900.123.456-8" -> "900123456-8"); si trae letras
  // en una cedula, se rechaza en vez de quitarselas en silencio.
  if (traeNumero) listo.numero_documento = limpiarFormato(tipo, listo.numero_documento);

  const numero = traeNumero ? listo.numero_documento : existente?.numero_documento;
  const documentoIgual =
    existente !== null &&
    texto(tipo) === texto(existente.tipo_documento) &&
    texto(numero) === texto(existente.numero_documento);

  if (!documentoIgual && (traeNumero || listo.tipo_documento !== undefined)) {
    const problema = validarDocumento(tipo, numero);
    if (problema) throw ApiError.badRequest(problema);
  }

  if (listo.correo !== undefined && listo.correo !== null) {
    listo.correo = String(listo.correo).trim().toLowerCase();
    if (texto(listo.correo) !== texto(existente?.correo?.toLowerCase())) {
      const problema = validarCorreo(listo.correo);
      if (problema) throw ApiError.badRequest(problema);
    }
  }

  if (listo.telefono !== undefined && listo.telefono !== null) {
    listo.telefono = String(listo.telefono).trim();
    if (texto(listo.telefono) !== texto(existente?.telefono)) {
      const problema = validarTelefono(listo.telefono);
      if (problema) throw ApiError.badRequest(problema);
    }
  }

  return listo;
}
