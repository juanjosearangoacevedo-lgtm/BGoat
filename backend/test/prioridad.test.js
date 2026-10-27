import assert from "node:assert/strict";
import { test } from "node:test";
import { MAXIMO_DESPLAZADAS, estimarPrioridad } from "../src/lib/prioridad.js";

/**
 * La prioridad que le tocaria a una orden nueva. Mismo criterio que
 * `renumerarPrioridad()` de `lib/plan.js`: fecha de recepcion del lote, luego
 * fecha de registro del lote, luego su id; las ordenes del mismo lote van por
 * orden de creacion.
 */
const orden = (id, numero, prioridad, lote, recepcion, creacion = `${recepcion} 08:00:00`) => ({
  id_orden_produccion: id,
  numero_orden: numero,
  prioridad,
  id_lote: lote,
  codigo_lote: `LT-2026-000${lote}`,
  fecha_recepcion: recepcion,
  fecha_creacion: creacion,
});

const cola = [
  orden(1, "OP-2026-0001", 1, 1, "2026-10-01"),
  orden(2, "OP-2026-0002", 2, 2, "2026-10-05"),
  orden(3, "OP-2026-0003", 3, 3, "2026-10-12"),
];

test("un lote que llego despues de todos queda al final y no empuja a nadie", () => {
  const lote = { id_lote: 4, fecha_recepcion: "2026-10-20", fecha_creacion: "2026-10-20 09:00:00" };
  const estimada = estimarPrioridad(cola, lote);

  assert.equal(estimada.posicion, 4);
  assert.equal(estimada.total, 4);
  assert.equal(estimada.ordenesAntes, 3);
  assert.equal(estimada.totalDesplazadas, 0);
  assert.deepEqual(estimada.desplazadas, []);
});

test("un lote que llego antes se cuela y las demas bajan un puesto", () => {
  const lote = { id_lote: 4, fecha_recepcion: "2026-10-03", fecha_creacion: "2026-10-03 09:00:00" };
  const estimada = estimarPrioridad(cola, lote);

  assert.equal(estimada.posicion, 2);
  assert.equal(estimada.ordenesAntes, 1);
  assert.equal(estimada.totalDesplazadas, 2);
  assert.deepEqual(
    estimada.desplazadas.map((fila) => [fila.numero_orden, fila.prioridad_actual, fila.prioridad_nueva]),
    [["OP-2026-0002", 2, 3], ["OP-2026-0003", 3, 4]],
  );
});

test("sin ordenes pendientes la nueva es la #1", () => {
  const estimada = estimarPrioridad([], { id_lote: 1, fecha_recepcion: "2026-10-01", fecha_creacion: "2026-10-01 08:00:00" });
  assert.equal(estimada.posicion, 1);
  assert.equal(estimada.total, 1);
});

test("el mismo dia de recepcion se desempata por la fecha de registro del lote", () => {
  const lote = { id_lote: 9, fecha_recepcion: "2026-10-05", fecha_creacion: "2026-10-05 07:00:00" };
  // OP-0002 es del 05/10 registrado a las 08:00: el lote nuevo se registro antes, va primero.
  assert.equal(estimarPrioridad(cola, lote).posicion, 2);
  const tarde = { id_lote: 9, fecha_recepcion: "2026-10-05", fecha_creacion: "2026-10-05 17:00:00" };
  assert.equal(estimarPrioridad(cola, tarde).posicion, 3);
});

test("una orden nueva del mismo lote que otra va detras de ella", () => {
  const lote = { id_lote: 2, fecha_recepcion: "2026-10-05", fecha_creacion: "2026-10-05 08:00:00" };
  const estimada = estimarPrioridad(cola, lote);
  assert.equal(estimada.posicion, 3);
  assert.equal(estimada.desplazadas[0].numero_orden, "OP-2026-0003");
});

test("solo se listan las primeras desplazadas pero se cuentan todas", () => {
  const muchas = Array.from({ length: 9 }, (_, i) => orden(i + 1, `OP-2026-00${i + 1}`, i + 1, i + 1, `2026-10-${String(i + 10)}`));
  const lote = { id_lote: 99, fecha_recepcion: "2026-10-01", fecha_creacion: "2026-10-01 08:00:00" };
  const estimada = estimarPrioridad(muchas, lote);

  assert.equal(estimada.posicion, 1);
  assert.equal(estimada.totalDesplazadas, 9);
  assert.equal(estimada.desplazadas.length, MAXIMO_DESPLAZADAS);
  assert.equal(estimada.desplazadas[0].prioridad_nueva, 2);
});
