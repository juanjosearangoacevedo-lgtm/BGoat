import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAXIMO_LISTADO,
  bloqueoComoError,
  consultarEnlaces,
  enlacesDe,
  exigirSinEnlaces,
  mensajeDeBloqueo,
} from "../src/lib/enlaces.js";

/**
 * "A que esta enlazado un registro". Aqui se prueba lo que se le dice al
 * usuario, con consultas falsas; que el SQL de cada recurso lea bien las
 * tablas se prueba contra MySQL, no aqui.
 */
const lotes = [
  { id_lote: 1, codigo_lote: "LT-2026-0001", numero_pedido: "PED-12", codigo_referencia: "R-9703", nombre_referencia: "Camisa polo", estado: "EN_PROCESO" },
  { id_lote: 2, codigo_lote: "LT-2026-0002", numero_pedido: null, codigo_referencia: null, nombre_referencia: "Pantalon", estado: "PENDIENTE" },
];

/** Una `q` falsa: la cuenta (SELECT COUNT) y las filas (la misma consulta con LIMIT). */
const consultasCon = (filas) => async (sql) => (/COUNT\(\*\) AS total/.test(sql) ? [{ total: filas.length }] : filas);

test("el cliente con lotes activos queda bloqueado y se dice a cuales", async () => {
  const resultado = await consultarEnlaces(enlacesDe.clientes, 7, { q: consultasCon(lotes) });

  assert.equal(resultado.bloqueado, true);
  assert.equal(resultado.total, 2);
  assert.equal(resultado.mensaje, "No se puede eliminar este cliente: está enlazado a 2 lotes activos.");
  assert.equal(resultado.motivo, "Está enlazado a 2 lotes activos.");
  assert.deepEqual(
    resultado.enlaces.map((enlace) => enlace.titulo),
    ["LT-2026-0001", "LT-2026-0002"],
  );
  assert.equal(resultado.enlaces[0].detalle, "Pedido PED-12 · R-9703 Camisa polo · En proceso");
  assert.equal(resultado.enlaces[1].detalle, "Pantalon · Pendiente");
});

test("sin nada enlazado queda libre", async () => {
  const resultado = await consultarEnlaces(enlacesDe.clientes, 7, { q: consultasCon([]) });
  assert.deepEqual(resultado, {
    bloqueado: false, total: 0, mensaje: null, motivo: null, ayuda: null, enlaces: [],
  });
});

test("un recurso sin definicion de enlaces (causas, dias no laborales) siempre sale libre", async () => {
  const resultado = await consultarEnlaces(undefined, 1);
  assert.equal(resultado.bloqueado, false);
});

test("la concordancia del mensaje sigue al genero y al numero", () => {
  assert.equal(
    mensajeDeBloqueo(enlacesDe.tallas, 1),
    "No se puede eliminar esta talla: está enlazada a 1 lote activo.",
  );
  assert.equal(
    mensajeDeBloqueo(enlacesDe.modulos, 3, "desactivar"),
    "No se puede desactivar este módulo: está enlazado a 3 jornadas abiertas.",
  );
  assert.equal(
    mensajeDeBloqueo(enlacesDe.roles, 2),
    "No se puede eliminar este rol: está enlazado a 2 usuarios activos.",
  );
});

test("el error 409 nombra los lotes y trae la lista completa en el detalle", async () => {
  await assert.rejects(
    () => exigirSinEnlaces(enlacesDe.clientes, 7, { q: consultasCon(lotes) }),
    (error) =>
      error.status === 409 &&
      /No se puede eliminar este cliente: está enlazado a 2 lotes activos \(LT-2026-0001 y LT-2026-0002\)\./.test(
        error.message,
      ) &&
      /Finaliza esos lotes/.test(error.message) &&
      error.detalle.total === 2 &&
      error.detalle.enlaces.length === 2,
  );
});

test("con mas enlaces de los que se listan, el error dice cuantos faltan", () => {
  const filas = Array.from({ length: MAXIMO_LISTADO }, (_, i) => ({
    tipo: "lote", titulo: `LT-2026-${String(i + 1).padStart(4, "0")}`, detalle: "",
  }));
  const error = bloqueoComoError({
    bloqueado: true,
    total: MAXIMO_LISTADO + 3,
    mensaje: mensajeDeBloqueo(enlacesDe.clientes, MAXIMO_LISTADO + 3),
    ayuda: enlacesDe.clientes.ayuda,
    enlaces: filas,
  });
  assert.match(error.message, /y 3 más\)/);
});

test("exigirSinEnlaces deja pasar cuando nada lo mantiene en uso", async () => {
  await exigirSinEnlaces(enlacesDe.clientes, 7, { q: consultasCon([]) });
});

test("las ordenes cuentan la produccion capturada y las jornadas", async () => {
  const q = async (sql) => {
    if (/FROM registros_horarios/.test(sql)) return [{ total: 40 }];
    if (/COUNT\(\*\) AS total FROM \(/.test(sql)) return [{ total: 1 }];
    return [{ id_jornada_modulo: 5, fecha: "2026-10-20", codigo_modulo: "MOD-02" }];
  };
  const resultado = await consultarEnlaces(enlacesDe.ordenes, 3, { q });

  assert.equal(resultado.bloqueado, true);
  assert.equal(resultado.total, 2);
  assert.deepEqual(
    resultado.enlaces.map((enlace) => [enlace.tipo, enlace.titulo]),
    [["registro", "40 registro(s) de producción"], ["jornada", "Módulo MOD-02"]],
  );
  assert.equal(resultado.enlaces[1].detalle, "Jornada del 20/10/2026");
});

test("el lote une sus ordenes sin terminar con sus jornadas abiertas", async () => {
  let consulta = 0;
  const q = async (sql) => {
    if (/COUNT\(\*\) AS total FROM \(/.test(sql)) return [{ total: 1 }];
    consulta += 1;
    return consulta === 1
      ? [{ id_orden_produccion: 8, numero_orden: "OP-2026-0008", estado: "PENDIENTE" }]
      : [{ id_jornada_modulo: 5, fecha: "2026-10-26", codigo_modulo: "MOD-02" }];
  };
  const resultado = await consultarEnlaces(enlacesDe.lotes, 1, { q });

  assert.equal(resultado.total, 2);
  assert.deepEqual(
    resultado.enlaces.map((enlace) => enlace.titulo),
    ["OP-2026-0008", "Módulo MOD-02"],
  );
  assert.equal(resultado.enlaces[0].detalle, "Orden pendiente");
});
