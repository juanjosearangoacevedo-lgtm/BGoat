import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import {
  TIPOS_DOCUMENTO,
  digitoVerificacionNit,
  limpiarFormato,
  normalizarDocumento,
  validarDocumento,
} from "../src/lib/documentos.js";
import { prepararIdentidad, validarCorreo, validarTelefono } from "../src/lib/identidad.js";

/**
 * Reglas de los documentos y de los datos de contacto. No necesitan base de
 * datos: son funciones puras.
 */
const aceptados = [
  ["CC", "1234567"],
  ["CC", "123456"],
  ["CC", "1000717474"],
  ["TI", "1000717474"],
  ["TI", "98010112345"],
  ["CE", "12345"],
  ["CE", "1234567890"],
  ["NIT", "900123456"],
  ["NIT", "900123456-8"],
  ["NIT", "860002964-4"],
  ["NIT", "1000717474"],
  ["PASAPORTE", "AN123456"],
  ["OTRO", "ABC12"],
];

const rechazados = [
  ["CC", "12345", /debe tener de 6 a 10 dígitos/],
  ["CC", "12345678901", /debe tener de 6 a 10 dígitos/],
  ["CC", "12345A7", /solo admite números/],
  ["CC", "1.234.567", /solo admite números/],
  ["TI", "123456789", /debe tener de 10 a 11 dígitos/],
  ["CE", "1234", /debe tener de 5 a 10 dígitos/],
  ["NIT", "9001", /debe tener de 8 a 10 dígitos/],
  ["NIT", "900123456-12", /debe tener de 8 a 10 dígitos/],
  ["NIT", "ABC123456", /debe tener de 8 a 10 dígitos/],
  ["NIT", "900123456-1", /debería ser 8/],
  ["NIT", "860002964-5", /debería ser 4/],
  ["PASAPORTE", "AB1", /debe tener de 5 a 15 caracteres/],
  ["PASAPORTE", "an-123456", /solo admite letras y números/],
  ["OTRO", "A".repeat(16), /debe tener de 5 a 15 caracteres/],
];

test("los documentos bien escritos pasan", () => {
  for (const [tipo, numero] of aceptados) {
    assert.equal(validarDocumento(tipo, numero), "", `${tipo} ${numero}`);
  }
});

test("los documentos mal escritos se rechazan diciendo por que", () => {
  for (const [tipo, numero, motivo] of rechazados) {
    assert.match(validarDocumento(tipo, numero), motivo, `${tipo} ${numero}`);
  }
});

test("un documento vacio no lo juzga esta regla (la obligatoriedad es de quien lo pide)", () => {
  assert.equal(validarDocumento("CC", ""), "");
  assert.equal(validarDocumento("NIT", null), "");
  assert.equal(validarDocumento("CC", undefined), "");
});

test("el digito de verificacion sale de la formula de la DIAN", () => {
  assert.equal(digitoVerificacionNit("860002964"), 4);
  assert.equal(digitoVerificacionNit("900123456"), 8);
  assert.equal(digitoVerificacionNit("890900608"), 9);
  assert.equal(digitoVerificacionNit("800197268"), 4);
});

test("al normalizar queda solo lo que cada tipo admite", () => {
  assert.equal(normalizarDocumento("CC", " 1.234.567 "), "1234567");
  assert.equal(normalizarDocumento("TI", "10-00-71"), "100071");
  assert.equal(normalizarDocumento("NIT", "900.123.456-8"), "900123456-8");
  assert.equal(normalizarDocumento("NIT", "900123456–8"), "900123456-8");
  assert.equal(normalizarDocumento("NIT", "900123456--8"), "900123456-8");
  assert.equal(normalizarDocumento("NIT", "900123456-"), "900123456-");
  assert.equal(normalizarDocumento("NIT", "abc900"), "900");
  assert.equal(normalizarDocumento("PASAPORTE", "an 123-456"), "AN123456");
  assert.equal(normalizarDocumento("OTRO", "pep-0012"), "PEP0012");
  assert.equal(normalizarDocumento("CC", null), null);
});

test("la API solo quita el formato: las letras en una cedula se rechazan, no se borran", () => {
  assert.equal(limpiarFormato("CC", " 1.234.567 "), "1234567");
  assert.equal(limpiarFormato("NIT", "900.123.456–8"), "900123456-8");
  assert.equal(limpiarFormato("PASAPORTE", "an 123-456"), "AN123456");
  // Con letras en una cedula queda tal cual, y validarDocumento la rechaza.
  assert.equal(limpiarFormato("CC", "12AB5678901"), "12AB5678901");
  assert.match(validarDocumento("CC", limpiarFormato("CC", "12AB5678901")), /solo admite números/);
  assert.equal(limpiarFormato("CC", null), null);
});

test("la pantalla y el backend aplican exactamente la misma regla", async (t) => {
  const ruta = new URL("../../frontend/src/shared/validations/documentRules.js", import.meta.url);
  if (!existsSync(ruta)) {
    t.skip("no esta la carpeta del frontend (por ejemplo, dentro de la imagen del backend)");
    return;
  }
  const pantalla = await import(pathToFileURL(ruta.pathname.replace(/^\/([A-Za-z]:)/, "$1")).href);

  assert.deepEqual(pantalla.TIPOS_DOCUMENTO, TIPOS_DOCUMENTO);
  const casos = [...aceptados, ...rechazados.map(([tipo, numero]) => [tipo, numero]), ["CC", ""], ["NIT", "900.123.456-8"]];
  for (const [tipo, numero] of casos) {
    assert.equal(
      pantalla.validarDocumento(tipo, numero),
      validarDocumento(tipo, numero),
      `validar ${tipo} ${numero}`,
    );
    assert.equal(
      pantalla.normalizarDocumento(tipo, numero),
      normalizarDocumento(tipo, numero),
      `normalizar ${tipo} ${numero}`,
    );
  }
  for (const base of ["860002964", "900123456", "12345678", "1000717474"]) {
    assert.equal(pantalla.digitoVerificacionNit(base), digitoVerificacionNit(base));
  }
});

// --- Correo y telefono -------------------------------------------------

test("el correo se valida como en la pantalla", () => {
  assert.equal(validarCorreo("compras@empresa.com"), "");
  assert.equal(validarCorreo(""), "");
  assert.match(validarCorreo("compras@empresa"), /Correo inválido/);
  assert.match(validarCorreo("compras @empresa.com"), /espacios/);
  assert.match(validarCorreo(`${"a".repeat(120)}@empresa.com`), /máximo 120/);
});

test("el telefono admite digitos y separadores, entre 7 y 15", () => {
  assert.equal(validarTelefono("300 000 0000"), "");
  assert.equal(validarTelefono("+57 (601) 234-5678"), "");
  assert.equal(validarTelefono(""), "");
  assert.match(validarTelefono("30012ABC45"), /no puede contener letras/);
  assert.match(validarTelefono("300#000#0000"), /caracteres no permitidos/);
  assert.match(validarTelefono("123456"), /al menos 7 dígitos/);
  assert.match(validarTelefono("1234567890123456"), /máximo 15 dígitos/);
});

// --- prepararIdentidad -------------------------------------------------

const rechazo = (patron) => (error) => error.status === 400 && patron.test(error.message);

test("prepararIdentidad normaliza el documento y el correo antes de guardar", () => {
  const listo = prepararIdentidad(
    { tipo_documento: "NIT", numero_documento: "900.123.456-8", correo: "  Compras@Empresa.COM " },
    { tipoPorDefecto: "NIT" },
  );
  assert.equal(listo.numero_documento, "900123456-8");
  assert.equal(listo.correo, "compras@empresa.com");
});

test("prepararIdentidad rechaza un documento que no cumple su tipo", () => {
  assert.throws(
    () => prepararIdentidad({ tipo_documento: "CC", numero_documento: "12" }),
    rechazo(/cédula de ciudadanía debe tener de 6 a 10 dígitos/),
  );
  assert.throws(
    () => prepararIdentidad({ tipo_documento: "NIT", numero_documento: "900123456-1" }),
    rechazo(/debería ser 8/),
  );
  assert.throws(
    () => prepararIdentidad({ tipo_documento: "XX", numero_documento: "123456" }),
    rechazo(/tipo de documento no es válido/),
  );
});

test("prepararIdentidad no se traga las letras de una cedula", () => {
  assert.throws(
    () => prepararIdentidad({ tipo_documento: "CC", numero_documento: "12AB5678901" }),
    rechazo(/solo admite números/),
  );
});

test("sin tipo en el cuerpo se usa el tipo por defecto de la tabla", () => {
  assert.throws(
    () => prepararIdentidad({ numero_documento: "900123456-1" }, { tipoPorDefecto: "NIT" }),
    rechazo(/debería ser 8/),
  );
  assert.equal(prepararIdentidad({ numero_documento: "1234567" }, { tipoPorDefecto: "CC" }).numero_documento, "1234567");
});

test("un registro sin documento ni contacto pasa tal cual", () => {
  const datos = { nombre: "GEF", tipo_documento: "NIT", numero_documento: null, correo: null, telefono: null };
  assert.deepEqual(prepararIdentidad(datos, { tipoPorDefecto: "NIT" }), datos);
});

test("lo que no cambio no se vuelve a juzgar: un dato viejo no impide reactivar", () => {
  // El NIT de los clientes de demostracion trae un digito de verificacion que no cuadra.
  const existente = {
    tipo_documento: "NIT",
    numero_documento: "900123456-1",
    correo: "viejo@empresa",
    telefono: "123",
  };
  const reenviado = { ...existente, estado: "ACTIVO" };
  assert.deepEqual(prepararIdentidad(reenviado, { existente }), reenviado);
});

test("pero si se toca el documento, el nuevo valor si se juzga", () => {
  const existente = { tipo_documento: "NIT", numero_documento: "900123456-1", correo: null, telefono: null };
  assert.throws(
    () => prepararIdentidad({ ...existente, numero_documento: "900123456-2" }, { existente }),
    rechazo(/debería ser 8/),
  );
  assert.equal(
    prepararIdentidad({ ...existente, numero_documento: "900123456-8" }, { existente }).numero_documento,
    "900123456-8",
  );
});

test("cambiar solo el tipo vuelve a juzgar el numero guardado contra el tipo nuevo", () => {
  const existente = { tipo_documento: "NIT", numero_documento: "900123456-8", correo: null, telefono: null };
  assert.throws(
    () => prepararIdentidad({ tipo_documento: "CC" }, { existente }),
    rechazo(/solo admite números|debe tener de 6 a 10/),
  );
});

test("un correo o telefono nuevos invalidos se rechazan", () => {
  assert.throws(() => prepararIdentidad({ correo: "sin-arroba" }), rechazo(/Correo inválido/));
  assert.throws(() => prepararIdentidad({ telefono: "abc" }), rechazo(/no puede contener letras/));
});
