import { useMemo } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { endpoints } from "@/shared/services/endpoints";
import { nombreCliente } from "@/shared/utils/formatters";
import {
  clienteEstados,
  clienteTiposDocumento,
  crearClienteEsquema,
} from "../validations/clienteValidation";

/** Modulo Clientes -> tabla `clientes`. */
export const clienteDocumentTypes = clienteTiposDocumento;

export const clienteStatusOptions = clienteEstados.map((estado) => ({
  value: estado,
  label: estado === "ACTIVO" ? "Activo" : "Inactivo",
}));

export const emptyClienteForm = {
  tipo_documento: "NIT",
  numero_documento: "",
  razon_social: "",
  nombres: "",
  apellidos: "",
  telefono: "",
  correo: "",
  direccion: "",
  estado: "ACTIVO",
};

export function useClientesPage() {
  const crud = useCrudResource({
    recurso: endpoints.clientes,
    idField: "id_cliente",
    emptyForm: emptyClienteForm,
    nombreRegistro: (cliente) => nombreCliente(cliente),
    esquema: ({ items, editing }) => crearClienteEsquema({ lista: items, editing }),
  });

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: clienteStatusOptions,
      },
      {
        clave: "tipo_documento",
        label: "Documento",
        etiquetaTodos: "Todo tipo de documento",
        opciones: clienteDocumentTypes,
      },
      {
        clave: "tipoCliente",
        label: "Tipo",
        etiquetaTodos: "Empresas y personas",
        opciones: [
          { value: "empresa", label: "Empresas" },
          { value: "persona", label: "Personas" },
        ],
        comparar: (fila, valor) =>
          valor === "empresa" ? Boolean(fila.razon_social) : !fila.razon_social,
      },
    ],
    [],
  );

  /**
   * Se agrega `nombre` calculado (razon social o nombre de la persona) para
   * que el listado pueda ordenarse y exportarse por el nombre que se ve.
   * El backend descarta las columnas que no declara el recurso.
   */
  const filas = useMemo(
    () => crud.items.map((cliente) => ({ ...cliente, nombre: nombreCliente(cliente) })),
    [crud.items],
  );

  const lista = useListaAdmin(filas, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "nombre", direccion: "asc" },
    pageSize: 12,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const activos = crud.items.filter(
      (cliente) => String(cliente.estado || "").toUpperCase() === "ACTIVO",
    ).length;
    const empresas = crud.items.filter((cliente) => Boolean(cliente.razon_social)).length;

    return {
      total: crud.items.length,
      activos,
      inactivos: crud.items.length - activos,
      empresas,
      personas: crud.items.length - empresas,
    };
  }, [crud.items]);

  return { ...crud, lista, resumen };
}
