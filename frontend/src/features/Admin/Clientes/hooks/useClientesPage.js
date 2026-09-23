import { useMemo } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { endpoints } from "@/shared/services/endpoints";
import {
  clienteEstados,
  clienteTiposDocumento,
  crearClienteEsquema,
} from "../validations/clienteValidation";

/**
 * Modulo Clientes -> tabla `clientes`.
 *
 * Es el cliente-marca unificado: antes eran dos modulos (Clientes y
 * Marcas) sin ninguna llave entre ellos, y la relacion solo aparecia
 * dentro de un pedido. En la planta nadie dice "el lote de Crystal para
 * la marca GEF": dice "el lote de GEF".
 */
export const clienteDocumentTypes = clienteTiposDocumento;

export const clienteStatusOptions = clienteEstados.map((estado) => ({
  value: estado,
  label: estado === "ACTIVO" ? "Activo" : "Inactivo",
}));

export const emptyClienteForm = {
  nombre: "",
  descripcion: "",
  razon_social: "",
  tipo_documento: "NIT",
  numero_documento: "",
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
    nombreRegistro: (cliente) => cliente?.nombre || "el cliente",
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
        clave: "datosFiscales",
        label: "Datos",
        etiquetaTodos: "Completos e incompletos",
        opciones: [
          { value: "completos", label: "Con datos fiscales" },
          { value: "incompletos", label: "Sin datos fiscales" },
        ],
        // La fusion de clientes y marcas dejo filas sin NIT ni razon
        // social: este filtro es para encontrarlas y completarlas.
        comparar: (fila, valor) =>
          valor === "completos"
            ? Boolean(fila.numero_documento)
            : !fila.numero_documento,
      },
    ],
    [],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "nombre", direccion: "asc" },
    pageSize: 12,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const activos = crud.items.filter(
      (cliente) => String(cliente.estado || "").toUpperCase() === "ACTIVO",
    ).length;
    const conDatos = crud.items.filter((cliente) => Boolean(cliente.numero_documento)).length;

    return {
      total: crud.items.length,
      activos,
      inactivos: crud.items.length - activos,
      conDatos,
      sinDatos: crud.items.length - conDatos,
    };
  }, [crud.items]);

  return { ...crud, lista, resumen };
}
