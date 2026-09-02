import { useCallback, useEffect, useMemo, useState } from "react";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { accionLabels, usePermisosCatalogo } from "@/shared/hooks/usePermisosCatalogo";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";

/**
 * Modulo Permisos -> tablas `permisos` y `rol_permiso`.
 *
 * Es una pantalla de consulta: muestra el catalogo completo de permisos y que
 * rol tiene cada uno. La asignacion se hace en el formulario de Roles, para
 * que exista un unico sitio donde se edita la relacion rol-permiso.
 */
export { accionLabels } from "@/shared/hooks/usePermisosCatalogo";

export function usePermisosPage() {
  const catalogo = usePermisosCatalogo();

  const [roles, setRoles] = useState([]);
  const [asignaciones, setAsignaciones] = useState({});
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  /** Trae los roles y, de cada uno, los ids de `rol_permiso` que tiene. */
  const cargarAsignaciones = useCallback(async () => {
    setCargandoRoles(true);
    setError(null);
    try {
      const respuesta = await apiClient.get(endpoints.roles);
      const lista = respuesta?.datos ?? [];
      setRoles(lista);

      const matrices = await Promise.all(
        lista.map(async (rol) => {
          try {
            const permisos = await apiClient.get(buildPath(endpoints.rolPermisos, { id: rol.id_rol }));
            return [rol.id_rol, new Set((permisos?.permisos ?? []).map((p) => p.id_permiso))];
          } catch {
            return [rol.id_rol, new Set()];
          }
        }),
      );

      setAsignaciones(Object.fromEntries(matrices));
    } catch (problema) {
      setError(problema.message);
      setRoles([]);
      setAsignaciones({});
    } finally {
      setCargandoRoles(false);
    }
  }, []);

  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  const tiene = useCallback(
    (idRol, idPermiso) => Boolean(asignaciones[idRol]?.has(idPermiso)),
    [asignaciones],
  );

  /**
   * Cada fila es un permiso, con el conteo de roles que lo tienen concedido.
   *
   * Vienen ya ordenadas por modulo y por accion (Ver, Crear, Editar, ...): el
   * orden de la tabla es estable, asi que ese criterio se conserva como
   * desempate cuando el usuario ordena por otra columna.
   */
  const filas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return catalogo.grupos
      .flatMap((grupo) =>
        grupo.permisos.map((permiso) => ({
          ...permiso,
          etiquetaAccion: permiso.etiqueta,
          totalRoles: roles.filter((rol) => tiene(rol.id_rol, permiso.id_permiso)).length,
        })),
      )
      .filter((permiso) =>
        termino
          ? `${permiso.modulo} ${permiso.etiquetaAccion} ${permiso.nombre || ""}`
              .toLowerCase()
              .includes(termino)
          : true,
      );
  }, [catalogo.grupos, roles, tiene, busqueda]);

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "modulo",
        label: "Modulo",
        etiquetaTodos: "Todos los modulos",
        opciones: catalogo.grupos.map((grupo) => ({ value: grupo.modulo, label: grupo.modulo })),
      },
      {
        clave: "accion",
        label: "Accion",
        etiquetaTodos: "Todas las acciones",
        opciones: Object.entries(accionLabels).map(([valor, etiqueta]) => ({
          value: valor,
          label: etiqueta,
        })),
      },
      {
        clave: "asignacion",
        label: "Asignacion",
        etiquetaTodos: "Asignados y libres",
        opciones: [
          { value: "asignados", label: "Concedidos a algun rol" },
          { value: "libres", label: "Sin rol que los use" },
        ],
        comparar: (fila, valor) =>
          valor === "asignados" ? fila.totalRoles > 0 : fila.totalRoles === 0,
      },
    ],
    [catalogo.grupos],
  );

  const lista = useListaAdmin(filas, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "modulo", direccion: "asc" },
    pageSize: 25,
    extraReset: [busqueda],
  });

  const resumen = useMemo(
    () => ({
      permisos: catalogo.total,
      modulos: catalogo.grupos.length,
      roles: roles.length,
      sinUso: filas.filter((permiso) => permiso.totalRoles === 0).length,
    }),
    [catalogo.total, catalogo.grupos.length, roles.length, filas],
  );

  return {
    catalogo,
    roles,
    lista,
    resumen,
    busqueda,
    setBusqueda,
    tiene,
    cargando: catalogo.cargando || cargandoRoles,
    error: error || catalogo.error,
    recargar: cargarAsignaciones,
  };
}
