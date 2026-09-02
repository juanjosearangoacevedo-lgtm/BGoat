import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { usePermisosCatalogo } from "@/shared/hooks/usePermisosCatalogo";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";
import { validarFormulario } from "@/shared/validations";
import { avisoSinPermisos, crearRolEsquema, rolEstados } from "../validations/rolValidation";

/**
 * Modulo Roles -> tablas `roles` y `rol_permiso`.
 *
 * Un rol y sus permisos se administran juntos: el formulario guarda primero
 * la fila de `roles` y enseguida reemplaza su matriz en `rol_permiso`, de modo
 * que el usuario nunca tiene que ir a otra pantalla a terminar el trabajo.
 */
export const emptyRolForm = {
  nombre: "",
  descripcion: "",
  estado: "ACTIVO",
};

export function useRolesPage() {
  const crud = useCrudResource({
    recurso: endpoints.roles,
    idField: "id_rol",
    emptyForm: emptyRolForm,
    nombreRegistro: (rol) => (rol?.nombre ? `el rol ${rol.nombre}` : "el rol"),
  });

  const catalogo = usePermisosCatalogo();

  const [seleccionados, setSeleccionados] = useState(() => new Set());
  const [cargandoPermisos, setCargandoPermisos] = useState(false);
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [permisosDetalle, setPermisosDetalle] = useState([]);

  /** Permisos que ya tiene un rol, leidos de `rol_permiso`. */
  const traerPermisosDelRol = useCallback(async (idRol) => {
    const respuesta = await apiClient.get(buildPath(endpoints.rolPermisos, { id: idRol }));
    return respuesta?.permisos ?? [];
  }, []);

  // ---- Formulario unificado -------------------------------------------
  const abrirCrear = () => {
    setSeleccionados(new Set());
    crud.openCreate();
  };

  const abrirEditar = async (rol) => {
    crud.openEdit(rol);
    setSeleccionados(new Set());
    setCargandoPermisos(true);

    try {
      const permisos = await traerPermisosDelRol(rol.id_rol);
      setSeleccionados(new Set(permisos.map((permiso) => permiso.id_permiso)));
    } catch (problema) {
      toast.error(`No se pudieron cargar los permisos del rol: ${problema.message}`);
    } finally {
      setCargandoPermisos(false);
    }
  };

  const alternarPermiso = (idPermiso) => {
    setSeleccionados((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(idPermiso)) siguiente.delete(idPermiso);
      else siguiente.add(idPermiso);
      return siguiente;
    });
  };

  /** Marca o desmarca de un golpe todos los permisos de un modulo. */
  const alternarModulo = (modulo) => {
    const grupo = catalogo.grupos.find((entrada) => entrada.modulo === modulo);
    if (!grupo) return;

    const ids = grupo.permisos.map((permiso) => permiso.id_permiso);

    setSeleccionados((previo) => {
      const siguiente = new Set(previo);
      const todos = ids.every((id) => siguiente.has(id));
      ids.forEach((id) => (todos ? siguiente.delete(id) : siguiente.add(id)));
      return siguiente;
    });
  };

  const alternarTodos = () => {
    setSeleccionados((previo) =>
      previo.size === catalogo.total ? new Set() : new Set(catalogo.permisos.map((p) => p.id_permiso)),
    );
  };

  const validar = () => {
    const errores = validarFormulario(
      crud.form,
      crearRolEsquema({ lista: crud.items, editing: crud.editing }),
    );
    crud.setErrors(errores);

    if (Object.keys(errores).length > 0) {
      toast.error("Revisa los campos marcados antes de guardar");
      return false;
    }
    const aviso = avisoSinPermisos(seleccionados);
    if (aviso) toast.warning(aviso);
    return true;
  };

  /** Guarda la fila de `roles` y su matriz de `rol_permiso` en un solo paso. */
  const guardarRol = async () => {
    if (!validar()) return false;

    const payload = {
      nombre: String(crud.form.nombre).trim(),
      descripcion: crud.form.descripcion ? String(crud.form.descripcion).trim() : null,
      estado: crud.form.estado || "ACTIVO",
    };

    setGuardandoRol(true);
    try {
      const rol = crud.editing
        ? await apiClient.put(`${endpoints.roles}/${crud.editing.id_rol}`, payload)
        : await apiClient.post(endpoints.roles, payload);

      const idRol = rol?.id_rol ?? crud.editing?.id_rol;

      try {
        await apiClient.put(buildPath(endpoints.rolPermisos, { id: idRol }), {
          permisos: Array.from(seleccionados),
        });
        toast.success(
          crud.editing
            ? `Rol actualizado con ${seleccionados.size} permiso(s)`
            : `Rol creado con ${seleccionados.size} permiso(s)`,
        );
      } catch (problema) {
        // El rol quedo guardado: el usuario debe saber que falto la matriz.
        toast.error(`El rol se guardo, pero los permisos no: ${problema.message}`);
      }

      crud.closeModal();
      await crud.recargar();
      return true;
    } catch (problema) {
      if (problema.status === 409) crud.setErrors({ nombre: problema.message });
      toast.error(problema.message);
      return false;
    } finally {
      setGuardandoRol(false);
    }
  };

  // ---- Detalle ---------------------------------------------------------
  const verDetalle = async (rol) => {
    crud.verDetalle(rol);
    setPermisosDetalle([]);

    try {
      setPermisosDetalle(await traerPermisosDelRol(rol.id_rol));
    } catch {
      // El detalle del rol se muestra igual aunque falle el listado de permisos.
    }
  };

  // ---- Listado ---------------------------------------------------------
  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: rolEstados.map((estado) => ({
          value: estado,
          label: estado === "ACTIVO" ? "Activo" : "Inactivo",
        })),
      },
      {
        clave: "conPermisos",
        label: "Permisos",
        etiquetaTodos: "Con y sin permisos",
        opciones: [
          { value: "si", label: "Con permisos" },
          { value: "no", label: "Sin permisos" },
        ],
        comparar: (fila, valor) =>
          valor === "si" ? Number(fila.total_permisos || 0) > 0 : Number(fila.total_permisos || 0) === 0,
      },
    ],
    [],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "nombre", direccion: "asc" },
    pageSize: 10,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const activos = crud.items.filter((rol) => String(rol.estado).toUpperCase() === "ACTIVO").length;
    return {
      total: crud.items.length,
      activos,
      inactivos: crud.items.length - activos,
      permisosAsignados: crud.items.reduce((suma, rol) => suma + Number(rol.total_permisos || 0), 0),
    };
  }, [crud.items]);

  return {
    ...crud,
    lista,
    resumen,
    catalogo,
    seleccionados,
    cargandoPermisos,
    guardandoRol,
    permisosDetalle,
    abrirCrear,
    abrirEditar,
    alternarPermiso,
    alternarModulo,
    alternarTodos,
    guardarRol,
    verDetalle,
  };
}
