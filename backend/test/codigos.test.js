import assert from "node:assert/strict";
import { test } from "node:test";
import { formatearCodigo, generadorDeCodigo, numeroDeCodigo } from "../src/lib/codigos.js";
import { ESCALA_DE_LETRAS, ordenTallasSql } from "../src/lib/tallas.js";

/**
 * Los codigos que asigna el sistema (MOD-01, OP-001) y el orden de las tallas.
 * No necesitan base de datos: la consulta se cambia por una falsa. Que el SQL
 * lea bien los codigos y ordene bien las tallas se prueba contra MySQL.
 */
const modulo = { tabla: "modulos", columna: "codigo", prefijo: "MOD-", ancho: 2 };
const operario = { tabla: "operarios", columna: "codigo_operario", prefijo: "OP-", ancho: 3 };

/** Una consulta falsa que devuelve `maximo` y guarda con que se la llamo. */
function consultaCon(maximo) {
  const llamadas = [];
  const consulta = async (sql, parametros) => {
    llamadas.push({ sql, parametros });
    return { maximo };
  };
  return { consulta, llamadas };
}

test("el siguiente codigo es el mas alto que existe mas uno", async () => {
  const { consulta } = consultaCon(12);
  assert.equal(await generadorDeCodigo(modulo, consulta)(), "MOD-13");
});

test("sin ningun codigo todavia arranca en 1", async () => {
  const { consulta } = consultaCon(null);
  assert.equal(await generadorDeCodigo(modulo, consulta)(), "MOD-01");
  assert.equal(await generadorDeCodigo(operario, consulta)(), "OP-001");
});

test("el operario lleva tres cifras y el modulo dos, y crecen cuando hace falta", async () => {
  assert.equal(await generadorDeCodigo(operario, consultaCon(8).consulta)(), "OP-009");
  assert.equal(await generadorDeCodigo(operario, consultaCon(999).consulta)(), "OP-1000");
  assert.equal(await generadorDeCodigo(modulo, consultaCon(99).consulta)(), "MOD-100");
});

test("la consulta mira solo los codigos con ese formato", async () => {
  const { consulta, llamadas } = consultaCon(3);
  await generadorDeCodigo(modulo, consulta)();

  assert.deepEqual(llamadas[0].parametros, [5, "^MOD-[0-9]+$"]);
  assert.match(llamadas[0].sql, /FROM `modulos`/);
  assert.match(llamadas[0].sql, /`codigo` REGEXP \?/);
});

test("formatearCodigo y numeroDeCodigo se corresponden", () => {
  assert.equal(formatearCodigo("MOD-", 7, 2), "MOD-07");
  assert.equal(numeroDeCodigo("MOD-", "MOD-07"), 7);
  assert.equal(numeroDeCodigo("MOD-", "MOD-"), null);
  assert.equal(numeroDeCodigo("MOD-", "M1"), null);
  assert.equal(numeroDeCodigo("MOD-", "MOD-7B"), null);
  assert.equal(numeroDeCodigo("MOD-", null), null);
});

test("un nombre de tabla o columna raro no se acepta", () => {
  assert.throws(() => generadorDeCodigo({ ...modulo, tabla: "modulos; DROP TABLE x" }), /invalido/);
  assert.throws(() => generadorDeCodigo({ ...modulo, columna: "codigo`" }), /invalido/);
});

// --- Orden de las tallas ------------------------------------------------

test("el orden de las tallas arma las cuatro familias y la escala de letras", () => {
  const sql = ordenTallasSql("t.nombre");

  assert.match(sql, /UPPER\(TRIM\(t\.nombre\)\)/);
  assert.ok(sql.includes("'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'"), "la escala va de menor a mayor");
  // XXS, XXL y XXXL se leen como 2XS, 2XL y 3XL.
  assert.match(sql, /'XXXL', '3XL'/);
  assert.match(sql, /'XXL', '2XL'/);
  assert.equal(sql.match(/WHEN/g).length, 4);
  assert.deepEqual(ESCALA_DE_LETRAS.slice(2, 8), ["XS", "S", "M", "L", "XL", "2XL"]);
});
