import mysql from "mysql2/promise";
import { env } from "./env.js";

/**
 * Pool de conexiones a MySQL.
 * Todas las consultas del backend pasan por aqui.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // DATE y DATETIME llegan como texto: no hay corrimiento de zona horaria
  timezone: "local",
  charset: "utf8mb4",
});

/** Consulta que devuelve filas. */
export async function query(sql, params = []) {
  const [filas] = await pool.execute(sql, params);
  return filas;
}

/** Consulta que devuelve una sola fila (o null). */
export async function queryOne(sql, params = []) {
  const filas = await query(sql, params);
  return filas[0] ?? null;
}

/** INSERT / UPDATE / DELETE. Devuelve el ResultSetHeader. */
export async function execute(sql, params = []) {
  const [resultado] = await pool.execute(sql, params);
  return resultado;
}

/** Ejecuta varias sentencias dentro de una transaccion. */
export async function transaction(callback) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await callback(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function verificarConexion() {
  const fila = await queryOne("SELECT DATABASE() AS db, VERSION() AS version");
  return fila;
}
