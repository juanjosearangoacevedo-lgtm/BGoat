import { Router } from "express";
import { ApiError, asyncHandler } from "../lib/http.js";
import { listarDepartamentos, listarMunicipios } from "../lib/ubicaciones.js";

export const ubicacionesRouter = Router();

/**
 * Departamentos y municipios para los formularios de direccion. Los pide
 * cualquier usuario con sesion: es un catalogo de consulta, sin datos del
 * negocio. Ver `lib/ubicaciones.js` para la fuente y su respaldo.
 */
ubicacionesRouter.get(
  "/departamentos",
  asyncHandler(async (_req, res) => {
    res.json(await listarDepartamentos());
  }),
);

ubicacionesRouter.get(
  "/departamentos/:id/municipios",
  asyncHandler(async (req, res) => {
    const resultado = await listarMunicipios(req.params.id);
    if (!resultado) throw ApiError.notFound("El departamento no existe");
    res.json(resultado);
  }),
);
