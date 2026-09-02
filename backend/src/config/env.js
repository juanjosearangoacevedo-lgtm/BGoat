import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(aqui, "../../.env") });

const requerido = (nombre, porDefecto) => {
  const valor = process.env[nombre] ?? porDefecto;
  if (valor === undefined) {
    throw new Error(`Falta la variable de entorno ${nombre}. Copia .env.example a .env y complétala.`);
  }
  return valor;
};

export const env = {
  puerto: Number(requerido("PORT", 4000)),
  origenes: requerido("CORS_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean),

  db: {
    host: requerido("DB_HOST", "localhost"),
    port: Number(requerido("DB_PORT", 3306)),
    user: requerido("DB_USER", "root"),
    password: requerido("DB_PASSWORD", ""),
    database: requerido("DB_NAME", "bgoat"),
  },

  jwt: {
    secreto: requerido("JWT_SECRET", "cambia-esta-clave-en-produccion"),
    expiracion: requerido("JWT_EXPIRES_IN", "8h"),
  },

  seguridad: {
    // Bloqueo temporal por intentos fallidos (alcance del proyecto).
    maxIntentos: Number(requerido("MAX_INTENTOS_FALLIDOS", 5)),
    minutosBloqueo: Number(requerido("MINUTOS_BLOQUEO", 15)),
  },
};
