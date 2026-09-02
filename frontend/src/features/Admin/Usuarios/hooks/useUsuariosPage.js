import { useMemo } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { endpoints } from "@/shared/services/endpoints";
import { nombreCompleto } from "@/shared/utils/formatters";
import {
  crearUsuarioEsquema,
  usuarioEstados,
  usuarioTiposDocumento,
} from "../validations/usuarioValidation";

/**
 * Modulo Usuarios -> tabla `usuarios`.
 *
 * La tabla guarda `clave_hash`, pero el formulario envia la contrasena en
 * claro en el campo `clave`: el hash lo calcula el backend.
 */
export const usuarioDocumentTypes = usuarioTiposDocumento;

export const usuarioStatusOptions = usuarioEstados.map((estado) => ({
  value: estado,
  label: estado === "ACTIVO" ? "Activo" : estado === "INACTIVO" ? "Inactivo" : "Bloqueado",
}));

export const emptyUsuarioForm = {
  id_rol: "",
  tipo_documento: "CC",
  numero_documento: "",
  nombres: "",
  apellidos: "",
  correo: "",
  telefono: "",
  clave: "",
  confirmar_clave: "",
  estado: "ACTIVO",
};

export function useUsuariosPage() {
  const roles = useCatalogo(endpoints.roles, { valor: "id_rol", etiqueta: "nombre" });

  const crud = useCrudResource({
    recurso: endpoints.usuarios,
    idField: "id_usuario",
    emptyForm: emptyUsuarioForm,
    nombreRegistro: (usuario) => nombreCompleto(usuario),
    esquema: ({ items, editing }) =>
      crearUsuarioEsquema({ lista: items, editing, roleOptions: roles.options }),
    transformarPayload: (datos, editando) => {
      const payload = { ...datos, id_rol: Number(datos.id_rol) };
      // La confirmacion solo existe en el formulario, no en la tabla.
      delete payload.confirmar_clave;
      // Al editar, una clave vacia significa "no cambiarla".
      if (editando && !payload.clave) delete payload.clave;
      return payload;
    },
  });

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: usuarioStatusOptions,
      },
      {
        clave: "id_rol",
        label: "Rol",
        etiquetaTodos: "Todos los roles",
        opciones: roles.options,
      },
      {
        clave: "tipo_documento",
        label: "Documento",
        etiquetaTodos: "Todo tipo de documento",
        opciones: usuarioDocumentTypes,
      },
    ],
    [roles.options],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "nombres", direccion: "asc" },
    pageSize: 10,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const contar = (estado) =>
      crud.items.filter((usuario) => String(usuario.estado || "").toUpperCase() === estado).length;

    return {
      total: crud.items.length,
      activos: contar("ACTIVO"),
      inactivos: contar("INACTIVO"),
      bloqueados: contar("BLOQUEADO"),
    };
  }, [crud.items]);

  return {
    ...crud,
    lista,
    resumen,
    roles: roles.datos,
    roleOptions: roles.options,
    roleName: (idRol) => roles.buscar(idRol)?.nombre || "",
  };
}
