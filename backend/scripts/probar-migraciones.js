/**
 * Prueba, en una base TEMPORAL, que las migraciones, el esquema y el seed
 * funcionan sobre una base vacia y que se pueden repetir:
 *
 *   npm run db:probar                 -> con los datos de demostracion
 *   npm run db:probar -- --sin-demo
 *
 * NO toca `bgoat` ni ninguna otra base tuya. Crea `bgoat_prueba_<hex>`, corre
 * ahi los mismos archivos que `db:setup` (cambiando el nombre de la base en el
 * texto de los .sql) dos veces seguidas, compara las dos corridas y borra la
 * base temporal al terminar.
 *
 * Es lo que hay que correr antes de fusionar una migracion `00*` nueva: lo que
 * no se ve probando solo sobre bases que ya existian. Una migracion que agrega
 * una columna sin mirar que la tabla exista pasa en una base vieja y falla en
 * una vacia, porque corre antes que `01_schema`.
 *
 * Por que es seguro aunque `.env` apunte a tu base de trabajo:
 *   - solo corre contra un MySQL local (localhost, 127.0.0.1 o ::1);
 *   - solo borra la base que ella misma nombro, y solo si se llama
 *     `bgoat_prueba_` + 8 hexadecimales y no existia antes;
 *   - antes de conectarse revisa los .sql ya reescritos y se niega a correr si
 *     alguno todavia nombra `bgoat` (en un USE o CREATE/DROP/ALTER DATABASE,
 *     como `bgoat.tabla` o como texto 'bgoat') o toca el servidor entero
 *     (SET GLOBAL, usuarios, permisos).
 *
 * Lee la lista de archivos de `setup-db.js`, asi que prueba exactamente lo que
 * `db:setup` correria, y falla si una migracion de `database/` no esta
 * registrada alli, si dos comparten numero o si no van en orden.
 */
import mysql from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../src/config/env.js";

const aqui = dirname(fileURLToPath(import.meta.url));
const carpetaSql = resolve(aqui, "../../database");
const conDemo = !process.argv.includes("--sin-demo");

const BASE_REAL = "bgoat";
const temporal = `bgoat_prueba_${randomBytes(4).toString("hex")}`;
const NOMBRE_TEMPORAL = /^bgoat_prueba_[0-9a-f]{8}$/;

/** Un motivo por el que no se corre nada: se muestra tal cual, sin traza. */
class Rechazo extends Error {}
const rechazar = (mensaje) => {
  throw new Rechazo(mensaje);
};

// ---------------------------------------------------------------------
// 1. Que archivos corre db:setup, y si estan en orden
// ---------------------------------------------------------------------
async function archivosDeSetup() {
  const fuente = await readFile(resolve(aqui, "setup-db.js"), "utf8");
  const bloque = fuente.match(/const archivos = \[([\s\S]*?)\];/);
  if (!bloque) {
    rechazar("No pude leer la lista `archivos` de scripts/setup-db.js: si cambio de forma, ajusta este script.");
  }
  const sinComentarios = bloque[1].replace(/\/\/.*$/gm, "");
  const lista = [...sinComentarios.matchAll(/"([^"]+\.sql)"/g)].map((m) => m[1]);
  const demo = fuente.match(/archivos\.push\("([^"]+\.sql)"\)/)?.[1] ?? null;
  return { lista, demo };
}

function revisarRegistro({ lista, demo }, enDisco) {
  const nombres = demo ? [...lista, demo] : lista;
  const faltan = nombres.filter((n) => !enDisco.has(n));
  if (faltan.length) rechazar(`setup-db.js lista archivos que no existen en database/: ${faltan.join(", ")}`);

  const sinRegistrar = [...enDisco].filter((n) => /^00.*\.sql$/.test(n) && !lista.includes(n));
  if (sinRegistrar.length) {
    rechazar(
      `Hay migraciones en database/ que setup-db.js no corre: ${sinRegistrar.join(", ")}. ` +
        "Agregalas a la lista `archivos`.",
    );
  }

  const migraciones = lista.filter((n) => /^00/.test(n));
  const porNumero = new Map();
  for (const n of migraciones) {
    const numero = n.match(/^(00[a-z]?)_/)?.[1];
    if (!numero) rechazar(`"${n}" no sigue el nombre 00<letra>_descripcion.sql`);
    porNumero.set(numero, [...(porNumero.get(numero) ?? []), n]);
  }
  const repetidos = [...porNumero].filter(([, archivos]) => archivos.length > 1);
  if (repetidos.length) {
    rechazar(
      "Dos migraciones comparten numero: " +
        repetidos.map(([numero, archivos]) => `${numero} -> ${archivos.join(" y ")}`).join("; ") +
        ". Renumera una.",
    );
  }

  const ordenadas = [...migraciones].sort();
  if (migraciones.some((n, i) => n !== ordenadas[i])) {
    rechazar("Las migraciones de setup-db.js no van en orden de numero (00, 00b, 00c, ...).");
  }
}

// ---------------------------------------------------------------------
// 2. Que ningun .sql pueda tocar otra cosa que la base temporal
// ---------------------------------------------------------------------
function loQueEscapaDeLaBaseTemporal(sql) {
  // Los comentarios pueden nombrar `bgoat` o decir GRANT sin ejecutarlo.
  const codigo = sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*--.*$/gm, "");

  const cambioDeBase = codigo.match(
    /^[ \t]*(USE|CREATE\s+(?:DATABASE|SCHEMA)|DROP\s+(?:DATABASE|SCHEMA)|ALTER\s+(?:DATABASE|SCHEMA))\b[^;]*\bbgoat\b/im,
  );
  if (cambioDeBase) return `nombra la base real: "${cambioDeBase[0].trim()}"`;

  const calificado = codigo.match(/(?:^|[^@\w`.])bgoat\.[a-z_`]/i);
  if (calificado) return `referencia calificada a la base real: "${calificado[0].trim()}"`;

  const literal = codigo.match(/['"]bgoat['"]/i);
  if (literal) return `cita la base real como texto: ${literal[0]}`;

  const global = codigo.match(
    /\b(SET\s+(?:GLOBAL|PERSIST)|CREATE\s+USER|DROP\s+USER|ALTER\s+USER|GRANT|REVOKE|INSTALL\s+PLUGIN)\b/i,
  );
  if (global) return `toca el servidor entero: "${global[0]}"`;

  return null;
}

async function leerReescritos(nombres) {
  const textos = [];
  for (const nombre of nombres) {
    const original = await readFile(resolve(carpetaSql, nombre), "utf8");
    const sql = original.replaceAll(`\`${BASE_REAL}\``, `\`${temporal}\``);
    const motivo = loQueEscapaDeLaBaseTemporal(sql);
    if (motivo) rechazar(`${nombre} ${motivo}. No se corre nada.`);
    textos.push([nombre, sql]);
  }
  return textos;
}

// ---------------------------------------------------------------------
// 3. Correr, fotografiar y comparar
// ---------------------------------------------------------------------
const conectar = (base) =>
  mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: base,
    multipleStatements: true,
  });

/** Cada corrida abre su propia conexion, como dos `db:setup` de verdad: las variables @ no pasan de una a otra. */
async function correr(titulo, textos) {
  console.log(`  ${titulo}`);
  const conexion = await conectar(undefined);
  try {
    for (const [nombre, sql] of textos) {
      process.stdout.write(`    ${nombre}... `);
      try {
        await conexion.query(sql);
      } catch (error) {
        console.log("ERROR");
        throw error;
      }
      console.log("ok");
    }
  } finally {
    await conexion.end();
  }
}

async function fotografiar() {
  const conexion = await conectar(temporal);
  try {
    const [objetos] = await conexion.query(
      `SELECT TABLE_NAME AS nombre, TABLE_TYPE AS tipo FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
      [temporal],
    );
    const esquema = {};
    const filas = {};
    for (const { nombre, tipo } of objetos) {
      if (tipo === "VIEW") {
        const [r] = await conexion.query(`SHOW CREATE VIEW \`${nombre}\``);
        esquema[nombre] = r[0]["Create View"].replace(/DEFINER=`[^`]*`@`[^`]*`/, "DEFINER=X");
      } else {
        const [r] = await conexion.query(`SHOW CREATE TABLE \`${nombre}\``);
        esquema[nombre] = r[0]["Create Table"].replace(/ AUTO_INCREMENT=\d+/, "");
        const [[{ n }]] = await conexion.query(`SELECT COUNT(*) AS n FROM \`${nombre}\``);
        filas[nombre] = n;
      }
    }
    const [claves] = await conexion.query("SELECT clave FROM migraciones ORDER BY clave");
    return { esquema, filas, claves: claves.map((f) => f.clave), tablas: Object.keys(filas).length, vistas: objetos.length - Object.keys(filas).length };
  } finally {
    await conexion.end();
  }
}

function diferencias(a, b) {
  const problemas = [];
  for (const nombre of new Set([...Object.keys(a.esquema), ...Object.keys(b.esquema)])) {
    if (a.esquema[nombre] !== b.esquema[nombre]) problemas.push(`el DDL de ${nombre} cambio`);
  }
  for (const nombre of new Set([...Object.keys(a.filas), ...Object.keys(b.filas)])) {
    if (a.filas[nombre] !== b.filas[nombre]) problemas.push(`${nombre} paso de ${a.filas[nombre]} a ${b.filas[nombre]} filas`);
  }
  if (a.claves.join("|") !== b.claves.join("|")) {
    problemas.push(`las claves de migraciones cambiaron: [${a.claves.join(", ")}] -> [${b.claves.join(", ")}]`);
  }
  return problemas;
}

// ---------------------------------------------------------------------
// 4. Limpieza: solo la base temporal que esta corrida nombro
// ---------------------------------------------------------------------
let hayQueLimpiar = false;

async function limpiar() {
  if (!hayQueLimpiar || !NOMBRE_TEMPORAL.test(temporal)) return;
  hayQueLimpiar = false;
  try {
    const conexion = await conectar(undefined);
    await conexion.query(`DROP DATABASE IF EXISTS \`${temporal}\``);
    await conexion.end();
  } catch (error) {
    console.error(`No pude borrar la base temporal ${temporal}: ${error.message}`);
    console.error(`Es solo de esta prueba; borrala a mano: DROP DATABASE \`${temporal}\`;`);
  }
}

process.on("SIGINT", async () => {
  console.error("\nInterrumpido: borrando la base temporal...");
  await limpiar();
  process.exit(130);
});

// ---------------------------------------------------------------------
try {
  if (!["localhost", "127.0.0.1", "::1"].includes(env.db.host)) {
    rechazar(`DB_HOST es "${env.db.host}": esta prueba solo corre contra un MySQL local (localhost o 127.0.0.1).`);
  }

  const registro = await archivosDeSetup();
  const enDisco = new Set((await readdir(carpetaSql)).filter((n) => n.endsWith(".sql")));
  revisarRegistro(registro, enDisco);

  if (conDemo && !registro.demo) rechazar("No encontre el archivo de demostracion en setup-db.js.");
  const nombres = conDemo ? [...registro.lista, registro.demo] : registro.lista;
  const textos = await leerReescritos(nombres);

  console.log(`Probando ${nombres.length} archivos en la base temporal ${temporal}.`);
  console.log(`Tu base "${BASE_REAL}" no se toca.\n`);

  // Una base con ese nombre no deberia existir; si existe, no se toca.
  const sonda = await conectar(undefined);
  const [existentes] = await sonda.query("SHOW DATABASES LIKE ?", [temporal]);
  await sonda.end();
  if (existentes.length) rechazar(`Ya existe una base llamada ${temporal}. Vuelve a correr la prueba.`);

  hayQueLimpiar = true;
  await correr("1/2  base vacia", textos);
  const primera = await fotografiar();
  await correr("2/2  otra vez, sobre la base ya cargada (conexion nueva)", textos);
  const segunda = await fotografiar();

  const problemas = diferencias(primera, segunda);
  if (problemas.length) {
    console.error("\nRepetir la carga cambio la base:");
    problemas.forEach((p) => console.error(`  - ${p}`));
    process.exitCode = 1;
  } else {
    console.log(`\nOK: sobre una base vacia corrio sin errores (${primera.tablas} tablas, ${primera.vistas} vistas) y repetirlo no cambio nada:`);
    console.log("    ni el esquema, ni las filas, ni las claves de `migraciones`.");
  }
} catch (error) {
  if (error instanceof Rechazo) {
    console.error(`\nNo se corrio la prueba: ${error.message}`);
  } else {
    console.error("\nLa prueba fallo:");
    console.error(`  ${error.sqlMessage || error.message}`);
  }
  process.exitCode = 1;
} finally {
  await limpiar();
}
