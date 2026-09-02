import { concordar, estaVacio } from "./formValidation";

/**
 * Reglas de campos numericos: rango, cantidad de digitos, enteros y telefonos.
 * Los limites deben coincidir con los de la columna en MySQL.
 */
const SOLO_DIGITOS = /^\d+$/;
const TELEFONO_PERMITIDO = /^[\d\s()+-]+$/;

/** Numero dentro de un rango. */
export const numero =
  ({ min, max, etiqueta = "El valor" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";

    const cantidad = Number(valor);
    if (!Number.isFinite(cantidad)) {
      return concordar(etiqueta, {
        singular: "debe ser un numero",
        plural: "deben ser numeros",
        femenino: "debe ser un numero",
        femeninoPlural: "deben ser numeros",
      });
    }
    if (min !== undefined && cantidad < min) return `${etiqueta} no puede ser menor que ${min}`;
    if (max !== undefined && cantidad > max) return `${etiqueta} no puede ser mayor que ${max}`;

    return "";
  };

/** Sin parte decimal: cantidades, personas, unidades. */
export const entero =
  ({ etiqueta = "El valor" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";
    return Number.isInteger(Number(valor))
      ? ""
      : concordar(etiqueta, {
          singular: "debe ser un numero entero",
          plural: "deben ser numeros enteros",
          femenino: "debe ser un numero entero",
          femeninoPlural: "deben ser numeros enteros",
        });
  };

/** Cantidades y precios que no admiten signo negativo. */
export const noNegativo =
  ({ etiqueta = "El valor" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";
    return Number(valor) < 0 ? `${etiqueta} no puede ser negativo` : "";
  };

/** Mayor que cero: cantidades programadas, precios de maquila. */
export const mayorQueCero =
  ({ etiqueta = "El valor" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";
    return Number(valor) > 0 ? "" : `${etiqueta} debe ser mayor que cero`;
  };

/** Documentos y codigos numericos: sin letras ni separadores. */
export const soloDigitos =
  (etiqueta = "Este campo") =>
  (valor) =>
    estaVacio(valor) || SOLO_DIGITOS.test(String(valor).trim())
      ? ""
      : concordar(etiqueta, {
          singular: "solo admite numeros",
          plural: "solo admiten numeros",
          femenino: "solo admite numeros",
          femeninoPlural: "solo admiten numeros",
        });

/** Cantidad de digitos permitida, contando solo los numeros del valor. */
export const digitos =
  ({ min, max, etiqueta = "Este campo" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";

    const cantidad = String(valor).replace(/\D/g, "").length;
    if (min !== undefined && cantidad < min) return `${etiqueta} requiere al menos ${min} digitos`;
    if (max !== undefined && cantidad > max) return `${etiqueta} admite maximo ${max} digitos`;

    return "";
  };

/**
 * Telefono colombiano: digitos y, como mucho, los separadores de siempre.
 * Sin letras, entre 7 (fijo) y 15 digitos (con indicativo).
 */
export const telefono =
  ({ min = 7, max = 15, etiqueta = "El telefono" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";

    const texto = String(valor).trim();
    if (/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(texto)) return `${etiqueta} no puede contener letras`;
    if (!TELEFONO_PERMITIDO.test(texto)) return `${etiqueta} tiene caracteres no permitidos`;

    return digitos({ min, max, etiqueta })(valor);
  };

/** El maximo no puede quedar por debajo del minimo (rangos de dos campos). */
export const noMenorQue =
  (campo, etiqueta = "Este valor") =>
  (valor, form) => {
    if (estaVacio(valor) || estaVacio(form?.[campo])) return "";
    return Number(valor) < Number(form[campo]) ? `${etiqueta} no puede ser menor que el minimo` : "";
  };

/** Tope contra otro campo: lo solicitado no puede superar lo disponible. */
export const noMayorQue =
  (campo, etiqueta = "Este valor", nombreTope = "lo disponible") =>
  (valor, form) => {
    if (estaVacio(valor) || estaVacio(form?.[campo])) return "";
    return Number(valor) > Number(form[campo]) ? `${etiqueta} no puede superar ${nombreTope}` : "";
  };
