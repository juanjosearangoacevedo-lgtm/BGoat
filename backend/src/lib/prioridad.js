/**
 * Que prioridad le tocaria a una orden nueva, antes de crearla.
 *
 * La prioridad no se digita: es la posicion de la orden en la cola de las que
 * no han terminado, ordenadas por la fecha de recepcion de su lote (la que
 * llego primero es la #1). Ese es el orden de `renumerarPrioridad()` en
 * `lib/plan.js`, que corre despues de crear la orden. Aqui se calcula lo
 * mismo con la orden todavia por nacer, para mostrarlo en el formulario:
 * "va a quedar #4, y estas pasan un puesto atras".
 *
 * El criterio, igual que alla: fecha de recepcion del lote, luego la fecha en
 * que se registro el lote, luego su id. Una orden nueva de un lote que ya tiene
 * ordenes queda detras de ellas (su id de orden es el mas alto).
 */
const comparar = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Negativo si `a` va antes que `b` en la cola por lote. */
function porLote(a, b) {
  return (
    comparar(String(a.fecha_recepcion), String(b.fecha_recepcion)) ||
    comparar(String(a.fecha_creacion), String(b.fecha_creacion)) ||
    Number(a.id_lote) - Number(b.id_lote)
  );
}

export const MAXIMO_DESPLAZADAS = 5;

/**
 * `pendientes` son las ordenes sin finalizar (con las columnas del lote:
 * `fecha_recepcion`, `fecha_creacion`, `id_lote`) y `lote` el lote de la orden
 * nueva. No hace falta que `pendientes` venga ordenado.
 */
export function estimarPrioridad(pendientes, lote) {
  const ordenadas = [...pendientes].sort(
    (a, b) => porLote(a, b) || Number(a.id_orden_produccion) - Number(b.id_orden_produccion),
  );
  const antes = ordenadas.filter((orden) => porLote(orden, lote) <= 0);
  const despues = ordenadas.filter((orden) => porLote(orden, lote) > 0);
  const posicion = antes.length + 1;

  return {
    posicion,
    total: pendientes.length + 1,
    ordenesAntes: antes.length,
    totalDesplazadas: despues.length,
    desplazadas: despues.slice(0, MAXIMO_DESPLAZADAS).map((orden, indice) => ({
      id_orden_produccion: orden.id_orden_produccion,
      numero_orden: orden.numero_orden,
      codigo_lote: orden.codigo_lote,
      prioridad_actual: orden.prioridad,
      prioridad_nueva: posicion + 1 + indice,
    })),
  };
}
