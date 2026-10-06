/**
 * Paradas del modulo dentro de una hora: de que hora a que hora estuvo
 * parado y por que causa.
 *
 * La digitadora ya no escribe "20 minutos": escribe "de 9:10 a 9:30" y
 * los minutos salen de ahi. Una causa puede repetirse en la misma hora
 * (la maquina se trabo dos veces). El backend aplica estas mismas reglas
 * (`normalizarPerdidas` en `captura.routes.js`); aqui se revisan para que
 * la digitadora vea el problema antes de guardar.
 */

/** "HH:MM" o "HH:MM:SS" -> minutos desde la medianoche (null si no es una hora). */
export function aMinutos(hora) {
  const partes = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(hora ?? "").trim());
  if (!partes) return null;
  return Number(partes[1]) * 60 + Number(partes[2]);
}

/** "07:00:00" -> "07:00": lo que entiende un `<input type="time">`. */
export const horaCorta = (hora) => (hora ? String(hora).slice(0, 5) : "");

/** Minutos de una parada, o 0 si todavia le falta alguna hora o esta al reves. */
export function minutosDeParada(parada) {
  const desde = aMinutos(parada?.hora_desde);
  const hasta = aMinutos(parada?.hora_hasta);
  if (desde === null || hasta === null || hasta <= desde) return 0;
  return hasta - desde;
}

/** Una fila que se agrego y se dejo en blanco no cuenta ni se valida. */
export const paradaVacia = (parada) =>
  !parada?.id_causa && !parada?.hora_desde && !parada?.hora_hasta;

/**
 * El primer problema de las paradas, o "" si estan bien:
 *   - cada parada lleva causa, desde y hasta;
 *   - hasta despues de desde;
 *   - las dos horas dentro de la franja;
 *   - ninguna se cruza con otra.
 */
export function problemaParadas(paradas = [], franja) {
  const inicio = aMinutos(franja?.hora_inicio);
  const fin = aMinutos(franja?.hora_fin);
  const rangos = [];

  for (const parada of paradas) {
    if (paradaVacia(parada)) continue;
    if (!parada.id_causa) return "Cada parada necesita su causa";
    const desde = aMinutos(parada.hora_desde);
    const hasta = aMinutos(parada.hora_hasta);
    if (desde === null || hasta === null) {
      return "Cada parada necesita la hora en que empezo y la hora en que termino";
    }
    if (hasta <= desde) return "En cada parada, la hora final va despues de la inicial";
    if (inicio !== null && fin !== null && (desde < inicio || hasta > fin)) {
      return `Las paradas tienen que quedar dentro de la hora (${horaCorta(franja.hora_inicio)} a ${horaCorta(franja.hora_fin)})`;
    }
    rangos.push([desde, hasta]);
  }

  rangos.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < rangos.length; i++) {
    if (rangos[i][0] < rangos[i - 1][1]) {
      return "Dos paradas se cruzan: el modulo no puede estar parado dos veces en el mismo minuto";
    }
  }
  return "";
}
