import { query } from "../config/db.js";
import { ApiError } from "./http.js";

/**
 * A que esta enlazado un registro, antes de eliminarlo o desactivarlo.
 *
 * Eliminar y desactivar son lo mismo en este sistema (nada con historia se
 * borra: se inactiva), y un registro que sigue en uso no puede salir de
 * circulacion: un cliente con lotes en proceso, una talla que usa el
 * desglose de un lote activo, un modulo con la jornada abierta. Cada recurso
 * declara aqui que cuenta como "en uso" y como se le dice al usuario.
 *
 *   sujeto     -> como se nombra en el mensaje ("este cliente")
 *   femenino   -> concordancia del participio ("enlazado" / "enlazada")
 *   plural     -> [singular, plural] de lo que lo mantiene ocupado
 *   ayuda      -> que hacer para poder continuar
 *   buscar     -> `async (id, q) => { total, items: [{ tipo, titulo, detalle }] }`
 *
 * Los `items` son solo los primeros (`MAXIMO_LISTADO`); `total` es la cuenta
 * completa. `q` es la funcion de consulta: se puede cambiar para probar sin
 * base de datos.
 */
export const MAXIMO_LISTADO = 8;

const ESTADOS = { PENDIENTE: "Pendiente", EN_PROCESO: "En proceso", FINALIZADO: "Finalizado" };

const fechaCorta = (iso) => String(iso).slice(0, 10).split("-").reverse().join("/");

/** "A", "A y B", "A, B y C". */
function enumerar(nombres) {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** Cuenta todas las filas de `sql` y trae las primeras. `sql` lleva su ORDER BY. */
async function enlazados(q, sql, parametros, mapear) {
  const cuenta = await q(`SELECT COUNT(*) AS total FROM (${sql}) AS enlaces`, parametros);
  const filas = await q(`${sql} LIMIT ${MAXIMO_LISTADO}`, parametros);
  return { total: Number(cuenta[0]?.total ?? 0), items: filas.map(mapear) };
}

/** Une varias fuentes de enlaces (por ejemplo ordenes y jornadas de un lote). */
function unir(...fuentes) {
  return {
    total: fuentes.reduce((suma, fuente) => suma + fuente.total, 0),
    items: fuentes.flatMap((fuente) => fuente.items).slice(0, MAXIMO_LISTADO),
  };
}

// --- Lo que mantiene ocupado a cada recurso ----------------------------------

const detalleDeLote = (fila) => ({
  tipo: "lote",
  titulo: fila.codigo_lote,
  detalle: [
    fila.numero_pedido && `Pedido ${fila.numero_pedido}`,
    [fila.codigo_referencia, fila.nombre_referencia].filter(Boolean).join(" "),
    ESTADOS[fila.estado] ?? fila.estado,
  ]
    .filter(Boolean)
    .join(" · "),
});

/** Un lote cuenta como activo si esta encendido y todavia no termino su produccion. */
const COLUMNAS_LOTE =
  "l.id_lote, l.codigo_lote, l.numero_pedido, l.codigo_referencia, l.nombre_referencia, l.estado";
const LOTE_ACTIVO = "l.activo = 1 AND l.estado <> 'FINALIZADO'";

const lotesDe = (columna, tabla = null) => (id, q = query) =>
  enlazados(
    q,
    tabla
      ? `SELECT ${COLUMNAS_LOTE} FROM ${tabla} d JOIN lotes l ON l.id_lote = d.id_lote
          WHERE d.${columna} = ? AND ${LOTE_ACTIVO}
          GROUP BY l.id_lote ORDER BY l.fecha_recepcion, l.id_lote`
      : `SELECT ${COLUMNAS_LOTE} FROM lotes l
          WHERE l.${columna} = ? AND ${LOTE_ACTIVO}
          ORDER BY l.fecha_recepcion, l.id_lote`,
    [id],
    detalleDeLote,
  );

const jornadaAbierta = (fila) => ({
  tipo: "jornada",
  titulo: `Módulo ${fila.codigo_modulo}`,
  detalle: [`Jornada abierta del ${fechaCorta(fila.fecha)}`, fila.codigo_lote && `lote ${fila.codigo_lote}`]
    .filter(Boolean)
    .join(" · "),
});

const definirEnlaces = (definicion) => definicion;

export const enlacesDe = {
  clientes: definirEnlaces({
    sujeto: "este cliente",
    femenino: false,
    plural: ["lote activo", "lotes activos"],
    ayuda: "Finaliza esos lotes o cámbiales el cliente, y vuelve a intentarlo.",
    buscar: lotesDe("id_cliente"),
  }),

  tallas: definirEnlaces({
    sujeto: "esta talla",
    femenino: true,
    plural: ["lote activo", "lotes activos"],
    ayuda: "Quítala del desglose de esos lotes o finalízalos, y vuelve a intentarlo.",
    buscar: lotesDe("id_talla", "lote_detalle_talla_color"),
  }),

  colores: definirEnlaces({
    sujeto: "este color",
    femenino: false,
    plural: ["lote activo", "lotes activos"],
    ayuda: "Quítalo del desglose de esos lotes o finalízalos, y vuelve a intentarlo.",
    buscar: lotesDe("id_color", "lote_detalle_talla_color"),
  }),

  "tipos-prenda": definirEnlaces({
    sujeto: "este tipo de prenda",
    femenino: false,
    plural: ["lote activo", "lotes activos"],
    ayuda: "Cámbiales el tipo de prenda a esos lotes o finalízalos, y vuelve a intentarlo.",
    buscar: lotesDe("id_tipo_prenda"),
  }),

  operarios: definirEnlaces({
    sujeto: "este operario",
    femenino: false,
    plural: ["jornada abierta", "jornadas abiertas"],
    ayuda: "Cierra esas jornadas o quítalo de su nómina, y vuelve a intentarlo.",
    buscar: (id, q = query) =>
      enlazados(
        q,
        `SELECT jm.id_jornada_modulo, jm.fecha, m.codigo AS codigo_modulo, l.codigo_lote
           FROM jornada_operaria jo
           JOIN jornada_modulo jm ON jm.id_jornada_modulo = jo.id_jornada_modulo
           JOIN modulos m ON m.id_modulo = jm.id_modulo
           JOIN lotes l ON l.id_lote = jm.id_lote
          WHERE jo.id_operario = ? AND jm.estado = 'ABIERTA'
          ORDER BY jm.fecha DESC, jm.id_jornada_modulo DESC`,
        [id],
        jornadaAbierta,
      ),
  }),

  modulos: definirEnlaces({
    sujeto: "este módulo",
    femenino: false,
    plural: ["jornada abierta", "jornadas abiertas"],
    ayuda: "Cierra la jornada del módulo y vuelve a intentarlo.",
    buscar: (id, q = query) =>
      enlazados(
        q,
        `SELECT jm.id_jornada_modulo, jm.fecha, m.codigo AS codigo_modulo, l.codigo_lote
           FROM jornada_modulo jm
           JOIN modulos m ON m.id_modulo = jm.id_modulo
           JOIN lotes l ON l.id_lote = jm.id_lote
          WHERE jm.id_modulo = ? AND jm.estado = 'ABIERTA'
          ORDER BY jm.fecha DESC, jm.id_jornada_modulo DESC`,
        [id],
        jornadaAbierta,
      ),
  }),

  responsables: definirEnlaces({
    sujeto: "este responsable",
    femenino: false,
    plural: ["causa activa", "causas activas"],
    ayuda: "Cámbiale el responsable a esas causas o desactívalas, y vuelve a intentarlo.",
    buscar: (id, q = query) =>
      enlazados(
        q,
        `SELECT c.id_causa, c.codigo, c.tipo FROM causas_desviacion c
          WHERE c.id_responsable = ? AND c.estado = 'ACTIVO'
          ORDER BY c.orden_visual, c.codigo`,
        [id],
        (fila) => ({ tipo: "causa", titulo: fila.codigo, detalle: `Causa ${String(fila.tipo).toLowerCase()}` }),
      ),
  }),

  lotes: definirEnlaces({
    sujeto: "este lote",
    femenino: false,
    plural: ["orden o jornada abierta", "órdenes y jornadas abiertas"],
    ayuda: "Finaliza o elimina esas órdenes y cierra esas jornadas, y vuelve a intentarlo.",
    buscar: async (id, q = query) =>
      unir(
        await enlazados(
          q,
          `SELECT o.id_orden_produccion, o.numero_orden, o.estado FROM ordenes_produccion o
            WHERE o.id_lote = ? AND o.estado <> 'FINALIZADO'
            ORDER BY o.numero_orden`,
          [id],
          (fila) => ({
            tipo: "orden",
            titulo: fila.numero_orden,
            detalle: `Orden ${(ESTADOS[fila.estado] ?? fila.estado).toLowerCase()}`,
          }),
        ),
        await enlazados(
          q,
          `SELECT jm.id_jornada_modulo, jm.fecha, m.codigo AS codigo_modulo FROM jornada_modulo jm
             JOIN modulos m ON m.id_modulo = jm.id_modulo
            WHERE jm.id_lote = ? AND jm.estado = 'ABIERTA'
            ORDER BY jm.fecha DESC, jm.id_jornada_modulo DESC`,
          [id],
          jornadaAbierta,
        ),
      ),
  }),

  roles: definirEnlaces({
    sujeto: "este rol",
    femenino: false,
    plural: ["usuario activo", "usuarios activos"],
    ayuda: "Cámbiales el rol a esos usuarios o desactívalos, y vuelve a intentarlo.",
    buscar: (id, q = query) =>
      enlazados(
        q,
        `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo FROM usuarios u
          WHERE u.id_rol = ? AND u.estado = 'ACTIVO'
          ORDER BY u.nombres, u.apellidos`,
        [id],
        (fila) => ({
          tipo: "usuario",
          titulo: [fila.nombres, fila.apellidos].filter(Boolean).join(" "),
          detalle: fila.correo,
        }),
      ),
  }),

  ordenes: definirEnlaces({
    sujeto: "esta orden",
    femenino: true,
    plural: ["registro o jornada", "registros y jornadas"],
    ayuda: "Una orden con producción o jornadas no se elimina: esa historia no se borra.",
    buscar: async (id, q = query) => {
      const [{ total: registros }] = await q(
        `SELECT COUNT(*) AS total FROM registros_horarios
          WHERE id_orden_produccion = ? AND estado <> 'ANULADO'`,
        [id],
      );
      const produccion = {
        total: Number(registros) > 0 ? 1 : 0,
        items:
          Number(registros) > 0
            ? [{ tipo: "registro", titulo: `${registros} registro(s) de producción`, detalle: "Producción ya capturada" }]
            : [],
      };
      return unir(
        produccion,
        await enlazados(
          q,
          `SELECT jm.id_jornada_modulo, jm.fecha, m.codigo AS codigo_modulo FROM jornada_modulo jm
             JOIN modulos m ON m.id_modulo = jm.id_modulo
            WHERE jm.id_orden_produccion = ?
            ORDER BY jm.fecha DESC, jm.id_jornada_modulo DESC`,
          [id],
          (fila) => ({
            tipo: "jornada",
            titulo: `Módulo ${fila.codigo_modulo}`,
            detalle: `Jornada del ${fechaCorta(fila.fecha)}`,
          }),
        ),
      );
    },
  }),
};

// --- Armar la respuesta -----------------------------------------------------

/** "Está enlazado a 3 lotes activos." */
export function motivoDeBloqueo(definicion, total) {
  const participio = definicion.femenino ? "enlazada" : "enlazado";
  const cuantos = total === 1 ? `1 ${definicion.plural[0]}` : `${total} ${definicion.plural[1]}`;
  return `Está ${participio} a ${cuantos}.`;
}

/** "No se puede eliminar este cliente: está enlazado a 3 lotes activos." */
export function mensajeDeBloqueo(definicion, total, accion = "eliminar") {
  const motivo = motivoDeBloqueo(definicion, total);
  return `No se puede ${accion} ${definicion.sujeto}: ${motivo[0].toLowerCase()}${motivo.slice(1)}`;
}

/**
 * Lo que responde `GET /:recurso/:id/enlaces`: si algo bloquea y que es. Sin
 * definicion (un recurso que nada mantiene ocupado) siempre sale libre.
 */
export async function consultarEnlaces(definicion, id, { accion = "eliminar", q = query } = {}) {
  const libre = { bloqueado: false, total: 0, mensaje: null, motivo: null, ayuda: null, enlaces: [] };
  if (!definicion) return libre;

  const { total, items } = await definicion.buscar(id, q);
  if (total === 0) return libre;

  return {
    bloqueado: true,
    total,
    mensaje: mensajeDeBloqueo(definicion, total, accion),
    motivo: motivoDeBloqueo(definicion, total),
    ayuda: definicion.ayuda,
    enlaces: items,
  };
}

/** El error 409 con los enlaces a la vista, para quien llama sin haber mirado antes. */
export function bloqueoComoError(resultado) {
  const nombres = resultado.enlaces.map((enlace) => enlace.titulo);
  const resto = resultado.total - nombres.length;
  const lista = enumerar(resto > 0 ? [...nombres, `${resto} más`] : nombres);

  return ApiError.conflict(`${resultado.mensaje.replace(/\.$/, "")} (${lista}). ${resultado.ayuda}`, {
    total: resultado.total,
    ayuda: resultado.ayuda,
    enlaces: resultado.enlaces,
  });
}

/** Si algo lo mantiene ocupado, corta con el 409; si no, sigue. */
export async function exigirSinEnlaces(definicion, id, opciones = {}) {
  const resultado = await consultarEnlaces(definicion, id, opciones);
  if (resultado.bloqueado) throw bloqueoComoError(resultado);
}
