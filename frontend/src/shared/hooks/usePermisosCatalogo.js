import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Catalogo de la tabla `permisos`, agrupado por modulo.
 *
 * Lo consumen el formulario de roles (para marcar los permisos del rol) y la
 * pantalla de consulta de permisos, de modo que ambos hablen del mismo
 * catalogo sin pedirlo dos veces cada uno por su lado.
 */
export const acciones = ["VER", "CREAR", "EDITAR", "ELIMINAR", "EXPORTAR"];

export const accionLabels = {
  VER: "Ver",
  CREAR: "Crear",
  EDITAR: "Editar",
  ELIMINAR: "Eliminar",
  EXPORTAR: "Exportar",
};

/** Orden de las acciones dentro de un modulo, para que la lista sea previsible. */
function ordenAccion(accion) {
  const indice = acciones.indexOf(accion);
  return indice === -1 ? acciones.length : indice;
}

export function usePermisosCatalogo() {
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    (async () => {
      setCargando(true);
      try {
        const respuesta = await apiClient.get(endpoints.permisos);
        if (activo) setPermisos(respuesta?.datos ?? []);
      } catch (problema) {
        if (activo) {
          setError(problema.message);
          setPermisos([]);
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  /** [{ modulo, permisos: [{ id_permiso, accion, etiqueta }] }] */
  const grupos = useMemo(() => {
    const porModulo = new Map();

    permisos.forEach((permiso) => {
      const modulo = permiso.modulo || "General";
      if (!porModulo.has(modulo)) porModulo.set(modulo, []);
      porModulo.get(modulo).push({
        ...permiso,
        etiqueta: accionLabels[permiso.accion] || permiso.accion,
      });
    });

    return Array.from(porModulo.entries())
      .map(([modulo, lista]) => ({
        modulo,
        permisos: lista.slice().sort((a, b) => ordenAccion(a.accion) - ordenAccion(b.accion)),
      }))
      .sort((a, b) => a.modulo.localeCompare(b.modulo, "es"));
  }, [permisos]);

  const porId = useMemo(
    () => new Map(permisos.map((permiso) => [permiso.id_permiso, permiso])),
    [permisos],
  );

  return { permisos, grupos, porId, cargando, error, total: permisos.length };
}
