/**
 * Cuantos minutos produce la planta un dia calendario dado.
 *
 * Cero si cae en una fecha de `dias_no_laborales` (festivo o cierre) o
 * si ningun patron de `jornada_dia` cubre ese dia de la semana (como
 * pasa hoy con el domingo, que no tiene fila).
 *
 * `patrones` es lo que devuelve `GET /jornada/horario`: cada uno trae
 * `dias` (1=lunes...7=domingo, igual que `jornada_dia.dia_semana`) y
 * `minutos_totales`.
 */
function minutosDelDia(fechaISO, patrones, festivos) {
  if (festivos.has(fechaISO)) return 0;

  const fecha = new Date(`${fechaISO}T00:00:00`);
  // JS: 0=domingo..6=sabado. La tabla usa 1=lunes..7=domingo.
  const diaSemana = ((fecha.getDay() + 6) % 7) + 1;
  const patron = patrones.find((p) => (p.dias || []).includes(diaSemana));
  return patron ? Number(patron.minutos_totales) || 0 : 0;
}

const UN_DIA_MS = 86400000;
const TOPE_DIAS = 3650; // 10 anios: evita un bucle infinito si algo viene en cero.

/**
 * La fecha en que estarian listas `cantidad` unidades, recorriendo dias
 * reales desde `fechaInicioISO` y saltando domingos y festivos.
 *
 * Es la misma formula del documento de German (minutos del dia x
 * personas / SAM x eficiencia esperada = unidades reales del dia), pero
 * aplicada dia por dia en vez de con el patron mas largo del mes, para
 * que la fecha que arroja sea una fecha de calendario real.
 *
 * Devuelve null si falta algun dato -es preferible no mostrar nada a
 * mostrar una fecha inventada-.
 */
export function calcularFechaEstimada({
  fechaInicioISO,
  cantidad,
  sam,
  personas,
  eficienciaEsperadaPct,
  patrones,
  festivos = [],
}) {
  if (!fechaInicioISO || !cantidad || !sam || !personas || !eficienciaEsperadaPct) return null;
  if (!Array.isArray(patrones) || patrones.length === 0) return null;

  const festivosSet = new Set(festivos);
  const eficiencia = eficienciaEsperadaPct / 100;

  let producidas = 0;
  let fecha = new Date(`${fechaInicioISO}T00:00:00`);
  let diasRecorridos = 0;

  while (producidas < cantidad && diasRecorridos < TOPE_DIAS) {
    const iso = fecha.toISOString().slice(0, 10);
    const minutos = minutosDelDia(iso, patrones, festivosSet);

    if (minutos > 0) {
      producidas += ((personas * minutos) / sam) * eficiencia;
    }

    if (producidas >= cantidad) break;
    fecha = new Date(fecha.getTime() + UN_DIA_MS);
    diasRecorridos += 1;
  }

  return diasRecorridos < TOPE_DIAS ? fecha.toISOString().slice(0, 10) : null;
}
