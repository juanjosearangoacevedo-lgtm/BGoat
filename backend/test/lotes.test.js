import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MENSAJE_IDENTIFICACION,
  normalizarTextosLote,
  prepararLote,
  tieneIdentificacion,
} from "../src/lib/lotes.js";

/**
 * Las reglas del lote que no necesitan base de datos: mayusculas, recorte y
 * "al menos uno de tres". Lo que si la necesita (el consecutivo del codigo
 * y la comparacion contra lo ya guardado al actualizar) se prueba contra
 * MySQL, no aqui.
 */

test("el pedido y el codigo de referencia se guardan en mayusculas y recortados", () => {
  const datos = normalizarTextosLote({ numero_pedido: "  ped-12 ", codigo_referencia: "ab-9703" });

  assert.equal(datos.numero_pedido, "PED-12");
  assert.equal(datos.codigo_referencia, "AB-9703");
});

test("el nombre de la referencia se recorta pero conserva su caso", () => {
  const datos = normalizarTextosLote({ nombre_referencia: "  Camiseta cuello Redondo " });

  assert.equal(datos.nombre_referencia, "Camiseta cuello Redondo");
});

test("un texto con solo espacios o vacio queda en NULL", () => {
  const datos = normalizarTextosLote({ numero_pedido: "   ", codigo_referencia: "", nombre_referencia: " " });

  assert.deepEqual(datos, { numero_pedido: null, codigo_referencia: null, nombre_referencia: null });
});

test("un campo que no llego no se inventa (actualizacion parcial)", () => {
  const datos = normalizarTextosLote({ numero_pedido: "p1" });

  assert.deepEqual(Object.keys(datos), ["numero_pedido"]);
});

test("las letras con tilde y la enie tambien suben a mayuscula", () => {
  assert.equal(normalizarTextosLote({ codigo_referencia: "pañal-ñ" }).codigo_referencia, "PAÑAL-Ñ");
});

test("un numero que llega como numero tambien se normaliza", () => {
  assert.equal(normalizarTextosLote({ codigo_referencia: 9703 }).codigo_referencia, "9703");
});

test("basta con uno de los tres para identificar el lote", () => {
  assert.equal(tieneIdentificacion({ numero_pedido: "P1" }), true);
  assert.equal(tieneIdentificacion({ codigo_referencia: "R1" }), true);
  assert.equal(tieneIdentificacion({ nombre_referencia: "Camiseta" }), true);
  assert.equal(tieneIdentificacion({ numero_pedido: "P1", codigo_referencia: "R1", nombre_referencia: "C" }), true);
});

test("sin ninguno de los tres no hay identificacion", () => {
  assert.equal(tieneIdentificacion({}), false);
  assert.equal(tieneIdentificacion({ numero_pedido: null, codigo_referencia: "  ", nombre_referencia: "" }), false);
});

test("el codigo de lote no cuenta como identificacion: lo asigna el sistema", () => {
  assert.equal(tieneIdentificacion({ codigo_lote: "LT-2026-0001" }), false);
});

test("crear sin ninguno de los tres se rechaza con 400", async () => {
  await assert.rejects(
    () => prepararLote({ id_cliente: 1, codigo_lote: "A-MANO", numero_pedido: "  " }),
    (error) => error.status === 400 && error.message === MENSAJE_IDENTIFICACION,
  );
});

test("crear con uno solo pasa, ya normalizado", async () => {
  const datos = await prepararLote({ id_cliente: 1, numero_pedido: " ped-5 " });

  assert.equal(datos.numero_pedido, "PED-5");
});
