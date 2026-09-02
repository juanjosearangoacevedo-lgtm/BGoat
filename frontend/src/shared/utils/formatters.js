/**
 * Utilidades de presentacion.
 *
 * Las pantallas reciben los registros con los nombres de columna de la base
 * de datos (`nombres`, `apellidos`, `razon_social`, `fecha_recepcion`, ...).
 * Aqui se concentra la unica capa que los convierte en texto para el usuario,
 * para que ningun modulo invente campos que la base no tiene.
 */

const GUION = "—";

/** `nombres` + `apellidos` de usuarios y operarios. */
export function nombreCompleto(persona) {
  if (!persona) return GUION;
  const partes = [persona.nombres, persona.apellidos].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : GUION;
}

/** Un cliente puede ser empresa (razon_social) o persona (nombres + apellidos). */
export function nombreCliente(cliente) {
  if (!cliente) return GUION;
  if (cliente.razon_social) return cliente.razon_social;
  return nombreCompleto(cliente);
}

/** "NIT 900123456" a partir de `tipo_documento` y `numero_documento`. */
export function documento(registro) {
  if (!registro?.numero_documento) return GUION;
  return `${registro.tipo_documento || "CC"} ${registro.numero_documento}`;
}

/** Iniciales para los avatares. */
export function iniciales(texto = "") {
  return String(texto)
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** DATE / DATETIME de MySQL -> dd/mm/aaaa. */
export function formatFecha(valor) {
  if (!valor) return GUION;
  const fecha = new Date(String(valor).replace(" ", "T"));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** DATETIME de MySQL -> dd/mm/aaaa hh:mm. */
export function formatFechaHora(valor) {
  if (!valor) return GUION;
  const fecha = new Date(String(valor).replace(" ", "T"));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return `${formatFecha(valor)} ${fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
}

/** DATETIME de MySQL -> aaaa-mm-dd, que es lo que espera un <input type="date">. */
export function aFechaInput(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

export function formatNumero(valor) {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero.toLocaleString("es-CO") : "0";
}

export function formatPorcentaje(valor, decimales = 0) {
  const numero = Number(valor ?? 0);
  return `${Number.isFinite(numero) ? numero.toFixed(decimales) : "0"}%`;
}

export function formatMoneda(valor) {
  const numero = Number(valor ?? 0);
  return numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

/** Porcentaje de avance acotado a 0-100 para las barras de progreso. */
export function porcentaje(parte, total) {
  const divisor = Number(total || 0);
  if (divisor <= 0) return 0;
  return Math.min(Math.round((Number(parte || 0) / divisor) * 100), 100);
}

export { GUION };
