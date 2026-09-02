/**
 * Crea la base de datos y carga los scripts SQL del proyecto.
 *
 *   npm run db:setup    -> crea/actualiza esquema y catalogos
 *   npm run db:reset    -> BORRA la base y la vuelve a crear desde cero
 *
 * Lee las credenciales de backend/.env (nunca se imprimen).
 */
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../src/config/env.js";

const aqui = dirname(fileURLToPath(import.meta.url));
const carpetaSql = resolve(aqui, "../../database");

const archivos = ["01_schema_bgoat.sql", "02_seed_bgoat.sql"];
const reset = process.argv.includes("--reset");
const conDemo = process.argv.includes("--demo");
if (conDemo) archivos.push("03_demo_bgoat.sql");

const conexion = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  multipleStatements: true,
});

try {
  if (reset) {
    console.log(`Eliminando la base "${env.db.database}"...`);
    await conexion.query(`DROP DATABASE IF EXISTS \`${env.db.database}\``);
  }

  for (const archivo of archivos) {
    const ruta = resolve(carpetaSql, archivo);
    const sql = await readFile(ruta, "utf8");
    process.stdout.write(`Ejecutando ${archivo}... `);
    await conexion.query(sql);
    console.log("ok");
  }

  const [tablas] = await conexion.query(
    `SELECT COUNT(*) AS total FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [env.db.database],
  );
  const [vistas] = await conexion.query(
    `SELECT COUNT(*) AS total FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?`,
    [env.db.database],
  );

  console.log(`\nBase "${env.db.database}" lista: ${tablas[0].total} tablas, ${vistas[0].total} vistas.`);
  console.log("Usuario inicial: admin@bgoat.com / Bgoat2026*  (cambiala despues del primer ingreso)");
} catch (error) {
  console.error("\nError cargando la base de datos:");
  console.error(`  ${error.sqlMessage || error.message}`);
  if (error.sql) console.error(`  SQL: ${String(error.sql).slice(0, 200)}...`);
  process.exitCode = 1;
} finally {
  await conexion.end();
}
