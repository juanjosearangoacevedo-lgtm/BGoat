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

/**
 * DATE / DATETIME de MySQL -> dd/mm/aaaa.
 *
 * Un DATE puro ("2026-01-01", sin hora) lo interpreta JS como medianoche
 * UTC; en Colombia (UTC-5) eso cae el dia anterior a partir de las 7pm
 * hora local, asi que un festivo del 1 de enero se veia 31 de diciembre.
 * Por eso, si no trae hora, se le pone una explicita (medianoche LOCAL,
 * no UTC) antes de construir el `Date`.
 */
export function formatFecha(valor) {
  if (!valor) return GUION;
  const texto = String(valor);
  const conHora = texto.includes(" ") || texto.includes("T") ? texto.replace(" ", "T") : `${texto}T00:00:00`;
  const fecha = new Date(conHora);
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

/**
 * El dia de HOY en la zona del equipo, no en UTC.
 *
 * `new Date().toISOString()` da la fecha UTC: en Colombia (UTC-5) eso
 * empieza a devolver el dia siguiente a partir de las 7:00pm, y la
 * pantalla se quedaria pidiendo la produccion de manana.
 *
 * Estaba duplicada palabra por palabra en `useCapturaPage` y en
 * `useJornadaPage`, y otras tres pantallas la importaban desde el hook de
 * captura: una dependencia entre features para pedir una fecha.
 */
export function hoyLocal() {
  const ahora = new Date();
  const desfase = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - desfase).toISOString().slice(0, 10);
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

/**
 * Dias entre dos fechas (DATE de MySQL, "aaaa-mm-dd"), contando el
 * primero y el ultimo: del lunes al lunes son 1 dia, del lunes al
 * martes son 2. `null` si falta alguna fecha o el rango es invalido.
 */
export function diasEntre(inicio, fin) {
  if (!inicio || !fin) return null;
  const desde = new Date(`${String(inicio).slice(0, 10)}T00:00:00`);
  const hasta = new Date(`${String(fin).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return null;
  const dias = Math.round((hasta - desde) / 86400000) + 1;
  return dias > 0 ? dias : null;
}

export { GUION };
