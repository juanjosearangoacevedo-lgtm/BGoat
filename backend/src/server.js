import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { verificarConexion } from "./config/db.js";
import { ApiError, traducirErrorMysql } from "./lib/http.js";
import { apiRouter } from "./routes/index.js";

const app = express();

/**
 * En desarrollo, Vite puede arrancar en un puerto distinto al configurado
 * (5173 ocupado -> 5174, etc.). Por eso se acepta cualquier puerto de
 * localhost salvo que NODE_ENV sea "production", donde manda la lista blanca.
 */
const esLocal = (origen) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen);
const enProduccion = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin(origen, callback) {
      // Sin Origin (Postman, curl) o dentro de la lista blanca.
      if (!origen || env.origenes.includes(origen)) return callback(null, true);
      if (!enProduccion && esLocal(origen)) return callback(null, true);
      return callback(new Error(`Origen no permitido por CORS: ${origen}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use("/api", apiRouter);

// --- 404 ---------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", ruta: req.originalUrl });
});

// --- Manejo central de errores -----------------------------------------
app.use((error, _req, res, _next) => {
  const traducido = traducirErrorMysql(error);
  const final = traducido || error;

  if (final instanceof ApiError) {
    return res.status(final.status).json({ error: final.message, detalle: final.detalle });
  }

  console.error("[BGoat] Error no controlado:", error);
  return res.status(500).json({ error: "Error interno del servidor" });
});

// --- Arranque ----------------------------------------------------------
try {
  const info = await verificarConexion();
  console.log(`[BGoat] Conectado a MySQL ${info.version} · base "${info.db}"`);
} catch (error) {
  console.error("[BGoat] No se pudo conectar a MySQL:", error.message);
  console.error('        Revisa el archivo backend/.env y que el servicio MySQL este corriendo.');
  process.exit(1);
}

app.listen(env.puerto, () => {
  console.log(`[BGoat] API escuchando en http://localhost:${env.puerto}/api`);
});
