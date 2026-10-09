import { execute, query, queryOne } from "../config/db.js";
import { ApiError } from "./http.js";

/**
 * El plan de produccion: prioridad, inicio y entrega de cada orden.
 *
 * Reglas acordadas con German (revision de octubre):
 *
 *   - PRIORIDAD: por fecha de recepcion del lote, el dia en que el
 *     cliente se lo entrego a German. El que llego primero es el #1. Si
 *     dos llegaron el mismo dia, desempata el orden en que se registraron.
 *     Solo se numeran las que no han terminado: #1 es la siguiente en
 *     la cola. Se reordena solo cuando entra o cambia un lote.
 *
 *   - INICIO: no se adivina. Las incidencias pueden retrasarlo todo, asi
 *     que el inicio es el dia en que un modulo ABRE JORNADA con la orden
 *     por primera vez. Mientras espera, la orden solo tiene prioridad.
 *
 *   - ENTREGA: desde ese inicio se aplica la formula del documento de
 *     German (minutos del dia x personas / SAM x eficiencia esperada =
 *     prendas del dia, dia por dia, sin domingos ni festivos), con las
 *     personas declaradas en esa primera jornada. La fecha queda FIJA:
 *     es el compromiso con el cliente. Si despues hay incidencias, el
 *     atraso se mide aparte (`dias_atraso` de `vw_avance_orden`).
 *
 *   - AJUSTE: si en una jornada posterior cambian las personas, el panel
 *     le avisa a German, y solo si el decide ajustar la eficiencia
 *     esperada la entrega se recalcula -desde el mismo inicio, con las
 *     personas nuevas- y vuelve a quedar fija (`ajustarEntrega`).
 *
 *   - Sin eficiencia esperada (o sin SAM) no hay entrega: la orden queda
 *     marcada y la fecha se calcula apenas German la llene.
 */

const TOPE_DIAS = 3650; // 10 anios: evita un bucle infinito si algo viene en cero.

const sumarDias = (iso, dias) => {
  const fecha = new Date(`${iso}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
};

/** 1 = lunes ... 7 = domingo, como `jornada_dia.dia_semana`. */
const diaSemana = (iso) => ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

/** Minutos de planta de un dia: 0 en domingos, festivos y cierres. */
async function cargarCalendario() {
  const [patrones, festivos] = await Promise.all([
    query("SELECT dias_semana, minutos_totales FROM vw_horario_jornada"),
    query("SELECT fecha FROM dias_no_laborales"),
  ]);

  const minutosPorDia = new Map();
  patrones.forEach((patron) => {
    String(patron.dias_semana || "")
      .split(",")
      .filter(Boolean)
      .forEach((dia) => minutosPorDia.set(Number(dia), Number(patron.minutos_totales) || 0));
  });
  const cerrados = new Set(festivos.map((fila) => String(fila.fecha).slice(0, 10)));

  return (iso) => (cerrados.has(iso) ? 0 : (minutosPorDia.get(diaSemana(iso)) ?? 0));
}

/**
 * La formula de German: el dia en que quedan hechas `cantidad` prendas
 * arrancando el dia `inicio`. Null si con esos datos no termina nunca.
 */
function fechaDeEntrega({ inicio, cantidad, sam, personas, eficienciaPct, minutosDelDia }) {
  const prendasPorMinuto = sam > 0 ? (personas * (eficienciaPct / 100)) / sam : 0;
  if (!inicio || prendasPorMinuto <= 0 || cantidad <= 0) return null;

  let hechas = 0;
  let fecha = String(inicio).slice(0, 10);
  for (let dias = 0; dias < TOPE_DIAS; dias++) {
    hechas += minutosDelDia(fecha) * prendasPorMinuto;
    if (hechas >= cantidad) return fecha;
    fecha = sumarDias(fecha, 1);
  }
  return null;
}

/** Prioridad = posicion por fecha de recepcion del lote, solo las no terminadas. */
async function renumerarPrioridad() {
  await execute(
    `UPDATE ordenes_produccion o
       JOIN (SELECT o2.id_orden_produccion,
                    ROW_NUMBER() OVER (
                      ORDER BY l.fecha_recepcion, l.fecha_creacion, l.id_lote, o2.id_orden_produccion
                    ) AS posicion
               FROM ordenes_produccion o2
               JOIN lotes l ON l.id_lote = o2.id_lote
              WHERE o2.estado <> 'FINALIZADO') r
         ON r.id_orden_produccion = o.id_orden_produccion
        SET o.prioridad = r.posicion`,
  );
}

/**
 * El inicio es el primer dia que un modulo abrio jornada con la orden.
 * Sale de `jornada_modulo`, asi da igual por donde le llego la orden a
 * la jornada (al abrirla, al corregirla o al crear la orden despues).
 */
async function marcarInicios() {
  await execute(
    `UPDATE ordenes_produccion o
       JOIN (SELECT id_orden_produccion, MIN(fecha) AS primera
               FROM jornada_modulo
              WHERE id_orden_produccion IS NOT NULL
              GROUP BY id_orden_produccion) j
         ON j.id_orden_produccion = o.id_orden_produccion
        SET o.fecha_inicio_real = LEAST(COALESCE(o.fecha_inicio_real, j.primera), j.primera),
            o.fecha_inicio_programada = LEAST(COALESCE(o.fecha_inicio_real, j.primera), j.primera)`,
  );
}

/** Las personas declaradas en la primera (o la ultima) jornada de la orden. */
async function personasDeJornada(idOrden, cual = "primera") {
  const fila = await queryOne(
    `SELECT cantidad_operarias FROM jornada_modulo
      WHERE id_orden_produccion = ?
      ORDER BY fecha ${cual === "primera" ? "ASC" : "DESC"}, id_jornada_modulo ${cual === "primera" ? "ASC" : "DESC"}
      LIMIT 1`,
    [idOrden],
  );
  return Number(fila?.cantidad_operarias) || 0;
}

async function guardarEntrega(orden, fin, personas) {
  await execute(
    `UPDATE ordenes_produccion
        SET fecha_fin_programada = ?, personas_entrega = ?, personas_aviso_visto = NULL
      WHERE id_orden_produccion = ?`,
    [fin, personas, orden.id_orden_produccion],
  );
  await execute("UPDATE lotes SET fecha_entrega_programada = ? WHERE id_lote = ?", [fin, orden.id_lote]);
}

/**
 * Calcula la entrega de las ordenes que ya arrancaron y todavia no la
 * tienen. Las que ya la tienen no se tocan: la fecha queda fija.
 */
async function calcularEntregasFaltantes() {
  const ordenes = await query(
    `SELECT o.id_orden_produccion, o.id_lote, o.fecha_inicio_real, o.cantidad_programada,
            o.eficiencia_esperada, l.sam_pactado
       FROM ordenes_produccion o
       JOIN lotes l ON l.id_lote = o.id_lote
      WHERE o.fecha_inicio_real IS NOT NULL AND o.fecha_fin_programada IS NULL`,
  );
  if (ordenes.length === 0) return;

  const minutosDelDia = await cargarCalendario();
  for (const orden of ordenes) {
    const personas = await personasDeJornada(orden.id_orden_produccion, "primera");
    const fin = fechaDeEntrega({
      inicio: orden.fecha_inicio_real,
      cantidad: Number(orden.cantidad_programada) || 0,
      sam: Number(orden.sam_pactado) || 0,
      personas,
      eficienciaPct: Number(orden.eficiencia_esperada) || 0,
      minutosDelDia,
    });
    if (fin) await guardarEntrega(orden, fin, personas);
  }
}

/** Prioridad, inicios y entregas que falten. Idempotente. */
export async function actualizarPlan() {
  await renumerarPrioridad();
  await marcarInicios();
  await calcularEntregasFaltantes();
}

/**
 * La decision de German cuando cambiaron las personas:
 *
 *   - "ajustar": nueva eficiencia esperada; la entrega se recalcula desde
 *     el mismo inicio con las personas de la ultima jornada, y queda fija.
 *   - "dejar":   no cambia nada; solo se apaga el aviso para esas personas.
 */
export async function decidirEntrega(idOrden, { accion, eficiencia_esperada } = {}) {
  const orden = await queryOne(
    `SELECT o.id_orden_produccion, o.id_lote, o.estado, o.fecha_inicio_real, o.cantidad_programada,
            o.eficiencia_esperada, l.sam_pactado
       FROM ordenes_produccion o
       JOIN lotes l ON l.id_lote = o.id_lote
      WHERE o.id_orden_produccion = ?`,
    [idOrden],
  );
  if (!orden) throw ApiError.notFound("La orden no existe");
  if (!orden.fecha_inicio_real) {
    throw ApiError.badRequest("La orden todavía no ha iniciado jornada: no tiene entrega que ajustar");
  }

  const personas = await personasDeJornada(idOrden, "ultima");

  if (accion === "dejar") {
    await execute("UPDATE ordenes_produccion SET personas_aviso_visto = ? WHERE id_orden_produccion = ?", [
      personas,
      idOrden,
    ]);
    return;
  }

  if (accion !== "ajustar") throw ApiError.badRequest('La acción debe ser "ajustar" o "dejar"');

  const eficiencia = Number(eficiencia_esperada);
  if (!(eficiencia > 0 && eficiencia <= 100)) {
    throw ApiError.badRequest("La eficiencia esperada debe estar entre 1 y 100");
  }

  const fin = fechaDeEntrega({
    inicio: orden.fecha_inicio_real,
    cantidad: Number(orden.cantidad_programada) || 0,
    sam: Number(orden.sam_pactado) || 0,
    personas,
    eficienciaPct: eficiencia,
    minutosDelDia: await cargarCalendario(),
  });
  if (!fin) throw ApiError.badRequest("Con esos datos no se puede calcular la entrega (revise el SAM del lote)");

  await execute("UPDATE ordenes_produccion SET eficiencia_esperada = ? WHERE id_orden_produccion = ?", [
    eficiencia,
    idOrden,
  ]);
  await guardarEntrega(orden, fin, personas);
}

/** Sin fallar: el plan se actualiza despues de algo que ya se guardo. */
export async function actualizarPlanSinFallar() {
  try {
    await actualizarPlan();
  } catch (error) {
    console.error("[BGoat] No se pudo actualizar el plan de producción:", error.message);
  }
}

/**
 * Middleware: despues de cualquier escritura que salio bien (lotes,
 * ordenes, jornada, captura), actualiza el plan ANTES de responder, para
 * que la pantalla -que recarga apenas recibe la respuesta- ya vea la
 * prioridad y la entrega nuevas. Se engancha a `res.send` (que tambien
 * usa `res.json`) para no tener que llamarlo en cada ruta.
 */
export function actualizarPlanAlEscribir(req, res, next) {
  if (req.method === "GET") return next();

  const enviar = res.send.bind(res);
  let hecho = false;
  res.send = (cuerpo) => {
    if (hecho || res.statusCode >= 400) return enviar(cuerpo);
    hecho = true;
    actualizarPlanSinFallar().finally(() => enviar(cuerpo));
    return res;
  };
  return next();
}
