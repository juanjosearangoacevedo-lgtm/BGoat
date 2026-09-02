import { concordar, estaVacio } from "./formValidation";

/**
 * Reglas de fechas: validez, limites contra hoy, rangos y relaciones entre
 * dos campos (inicio / fin).
 *
 * Los valores llegan como `aaaa-mm-dd` desde un <input type="date"> o como
 * DATETIME de MySQL; `aFecha` normaliza ambos.
 */
function aFecha(valor) {
  if (estaVacio(valor)) return null;
  const fecha = new Date(String(valor).replace(" ", "T"));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Hoy a las 00:00, para comparar dias completos sin la hora. */
function hoy() {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

export const fecha =
  ({ etiqueta = "La fecha" } = {}) =>
  (valor) => {
    if (estaVacio(valor)) return "";
    return aFecha(valor)
      ? ""
      : concordar(etiqueta, {
          singular: "no es valido",
          plural: "no son validos",
          femenino: "no es valida",
          femeninoPlural: "no son validas",
        });
  };

/** Fechas de hechos ya ocurridos: recepcion de un lote, ingreso de un operario. */
export const noFutura =
  ({ etiqueta = "La fecha" } = {}) =>
  (valor) => {
    const valida = aFecha(valor);
    if (!valida) return "";
    return valida > hoy() ? `${etiqueta} no puede ser futura` : "";
  };

/** Compromisos por cumplir: entregas programadas, vigencias. */
export const noPasada =
  ({ etiqueta = "La fecha" } = {}) =>
  (valor) => {
    const valida = aFecha(valor);
    if (!valida) return "";
    return valida < hoy() ? `${etiqueta} no puede ser anterior a hoy` : "";
  };

/** La fecha debe caer dentro de un rango fijo del negocio. */
export const entre =
  ({ desde, hasta, etiqueta = "La fecha" } = {}) =>
  (valor) => {
    const valida = aFecha(valor);
    if (!valida) return "";

    const minimo = aFecha(desde);
    const maximo = aFecha(hasta);
    if (minimo && valida < minimo) return `${etiqueta} no puede ser anterior a ${desde}`;
    if (maximo && valida > maximo) return `${etiqueta} no puede ser posterior a ${hasta}`;

    return "";
  };

/** La fecha de fin no puede quedar antes que la de inicio. */
export const posteriorA =
  (campo, etiqueta = "La fecha", nombreInicio = "la fecha de inicio") =>
  (valor, form) => {
    const valida = aFecha(valor);
    const inicio = aFecha(form?.[campo]);
    if (!valida || !inicio) return "";

    return valida < inicio ? `${etiqueta} no puede ser anterior a ${nombreInicio}` : "";
  };

/** La fecha de inicio no puede quedar despues que la de fin. */
export const anteriorA =
  (campo, etiqueta = "La fecha", nombreFin = "la fecha de finalizacion") =>
  (valor, form) => {
    const valida = aFecha(valor);
    const fin = aFecha(form?.[campo]);
    if (!valida || !fin) return "";

    return valida > fin ? `${etiqueta} no puede ser posterior a ${nombreFin}` : "";
  };

/** Edad calculada a partir de una fecha de nacimiento. */
export const edad =
  ({ min, max, etiqueta = "La edad" } = {}) =>
  (valor) => {
    const nacimiento = aFecha(valor);
    if (!nacimiento) return "";
    if (nacimiento > hoy()) return "La fecha de nacimiento no puede ser futura";

    const referencia = hoy();
    let anios = referencia.getFullYear() - nacimiento.getFullYear();
    const mes = referencia.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && referencia.getDate() < nacimiento.getDate())) anios -= 1;

    if (min !== undefined && anios < min) return `${etiqueta} minima es ${min} anios`;
    if (max !== undefined && anios > max) return `${etiqueta} maxima es ${max} anios`;

    return "";
  };
