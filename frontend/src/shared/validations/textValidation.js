import { concordar, estaVacio } from "./formValidation";

/**
 * Reglas de campos de texto: obligatoriedad, longitud, caracteres permitidos
 * y unicidad contra el listado ya cargado.
 */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
const CARACTERES_ESPECIALES = /[<>{}[\]\/|`~^*$%]/;

/** El campo no puede llegar vacio ni con solo espacios. */
export const requerido =
  (etiqueta = "Este campo") =>
  (valor) =>
    estaVacio(valor)
      ? concordar(etiqueta, {
          singular: "es obligatorio",
          plural: "son obligatorios",
          femenino: "es obligatoria",
          femeninoPlural: "son obligatorias",
        })
      : "";

/** Longitud minima y maxima, coherentes con el largo de la columna en MySQL. */
export const longitud =
  ({ min, max, etiqueta = "Este campo" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";
    const largo = String(valor).trim().length;

    if (min !== undefined && largo < min) {
      return concordar(etiqueta, {
        singular: `requiere al menos ${min} caracteres`,
        plural: `requieren al menos ${min} caracteres`,
        femenino: `requiere al menos ${min} caracteres`,
        femeninoPlural: `requieren al menos ${min} caracteres`,
      });
    }
    if (max !== undefined && largo > max) {
      return concordar(etiqueta, {
        singular: `admite maximo ${max} caracteres`,
        plural: `admiten maximo ${max} caracteres`,
        femenino: `admite maximo ${max} caracteres`,
        femeninoPlural: `admiten maximo ${max} caracteres`,
      });
    }
    return "";
  };

/** Nombres, apellidos, ciudades: letras, espacios, tildes, apostrofe y guion. */
export const soloLetras =
  (etiqueta = "Este campo") =>
  (valor) =>
    estaVacio(valor) || SOLO_LETRAS.test(String(valor).trim())
      ? ""
      : concordar(etiqueta, {
          singular: "solo admite letras",
          plural: "solo admiten letras",
          femenino: "solo admite letras",
          femeninoPlural: "solo admiten letras",
        });

/** Bloquea los simbolos que no aportan nada a un dato de negocio. */
export const sinCaracteresEspeciales =
  (etiqueta = "Este campo") =>
  (valor) =>
    estaVacio(valor) || !CARACTERES_ESPECIALES.test(String(valor))
      ? ""
      : concordar(etiqueta, {
          singular: "contiene caracteres no permitidos",
          plural: "contienen caracteres no permitidos",
          femenino: "contiene caracteres no permitidos",
          femeninoPlural: "contienen caracteres no permitidos",
        });

/** Regla libre para codigos y formatos propios del negocio. */
export const patron =
  (expresion, mensaje = "El formato no es valido") =>
  (valor) =>
    estaVacio(valor) || expresion.test(String(valor).trim()) ? "" : mensaje;

/**
 * Evita duplicados contra el listado que ya esta en pantalla.
 *
 * No reemplaza la restriccion UNIQUE de la base: le ahorra al usuario el
 * viaje al servidor y le senala el campo exacto.
 */
export const unico =
  ({ lista = [], campo, idField, actual = null, etiqueta = "Ese valor" }) =>
  (valor) => {
    if (estaVacio(valor)) return "";
    const normalizado = String(valor).trim().toLowerCase();

    const repetido = lista.some(
      (fila) =>
        String(fila?.[campo] ?? "").trim().toLowerCase() === normalizado &&
        (!actual || String(fila?.[idField]) !== String(actual?.[idField])),
    );

    return repetido ? `${etiqueta} ya existe` : "";
  };
