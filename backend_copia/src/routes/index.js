import { Router } from "express";
import { recursos } from "../config/resources.js";
import { crudRouter } from "../lib/crud.js";
import { query } from "../config/db.js";
import { asyncHandler } from "../lib/http.js";
import { requiereAuth, requierePermiso } from "../middleware/auth.js";
import { authRouter } from "./auth.routes.js";
import { capturaRouter } from "./captura.routes.js";
import { indicadoresRouter } from "./indicadores.routes.js";
import { jornadaRouter } from "./jornada.routes.js";
import { lotesRouter } from "./lotes.routes.js";
import { ordenesRouter } from "./ordenes.routes.js";
import { rolesRouter } from "./roles.routes.js";
import { usuariosRouter } from "./usuarios.routes.js";

export const apiRouter = Router();

// --- Publico -----------------------------------------------------------
apiRouter.get("/salud", (_req, res) => res.json({ ok: true, servicio: "bgoat-api" }));
apiRouter.use("/auth", authRouter);

// --- Todo lo demas exige sesion ---------------------------------------
apiRouter.use(requiereAuth);

// Catalogo de permisos (lo consume la matriz del front)
apiRouter.get(
  "/permisos",
  requierePermiso("Permisos", "VER"),
  asyncHandler(async (_req, res) => {
    const datos = await query(
      `SELECT id_permiso, nombre, modulo, accion, descripcion, estado
       FROM permisos WHERE estado = 'ACTIVO'
       ORDER BY id_permiso`,
    );
    res.json({ datos, total: datos.length });
  }),
);

// Rutas con logica propia
apiRouter.use("/usuarios", usuariosRouter);
apiRouter.use("/roles", rolesRouter);
apiRouter.use("/ordenes-produccion", ordenesRouter);
apiRouter.use("/jornada", jornadaRouter);
apiRouter.use("/captura", capturaRouter);
apiRouter.use("/indicadores", indicadoresRouter);

// La subida de la ficha tecnica va antes del CRUD generico de lotes:
// `/lotes/:id/ficha` es una ruta propia y el generico no la conoce.
apiRouter.use("/lotes", lotesRouter);

// CRUD generico a partir de la definicion de cada recurso
Object.entries(recursos).forEach(([ruta, definicion]) => {
  apiRouter.use(`/${ruta}`, crudRouter(definicion));
});
