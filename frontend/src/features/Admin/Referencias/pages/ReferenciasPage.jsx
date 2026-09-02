import { Tags } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";
import { crearReferenciaEsquema } from "../validations/referenciaValidation";

/**
 * Modulo Referencias -> tabla `referencias`.
 * La referencia es el estilo que la marca manda a confeccionar; sobre ella
 * cuelga la ficha tecnica con el SAM.
 */
export function ReferenciasPage() {
  const marcas = useCatalogo(endpoints.marcas, {
    valor: "id_marca",
    etiqueta: "nombre",
    filtros: { estado: "ACTIVO" },
  });

  return (
    <CrudPage
      titulo="Referencias"
      subtitulo="Estilos que confecciona la planta"
      recurso={endpoints.referencias}
      idField="id_referencia"
      etiquetaNuevo="Nueva referencia"
      busquedaPlaceholder="Buscar por codigo, nombre o descripcion..."
      nombreRegistro={(fila) => (fila?.codigo ? `la referencia ${fila.codigo}` : "la referencia")}
      emptyIcon={Tags}
      emptyTitle="No hay referencias registradas"
      emptyDescription="Cada lote llega con una referencia; sin ella no se puede crear la ficha tecnica ni el SAM."
      ordenInicial={{ campo: "codigo", direccion: "asc" }}
      filtrosLista={[
        {
          clave: "estado",
          label: "Estado",
          etiquetaTodos: "Todos los estados",
          opciones: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
          ],
        },
        {
          clave: "id_marca",
          label: "Marca",
          etiquetaTodos: "Todas las marcas",
          opciones: marcas.options,
        },
      ]}
      columnas={[
        { key: "codigo", header: "Codigo" },
        { key: "nombre", header: "Nombre" },
        { key: "nombre_marca", header: "Marca" },
        { key: "descripcion", header: "Descripcion" },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{ id_marca: "", codigo: "", nombre: "", descripcion: "", estado: "ACTIVO" }}
      required={["id_marca", "codigo", "nombre"]}
      esquema={({ items, editing }) =>
        crearReferenciaEsquema({ lista: items, editing, marcaOptions: marcas.options })
      }
      transformarPayload={(datos) => ({ ...datos, id_marca: Number(datos.id_marca) })}
      campos={[
        {
          name: "id_marca",
          label: "Marca",
          options: marcas.options,
          emptyOption: "Seleccionar marca",
          required: true,
        },
        { name: "codigo", label: "Codigo", placeholder: "9703", required: true, maxLength: 30 },
        {
          name: "nombre",
          label: "Nombre",
          placeholder: "Camiseta cuello redondo",
          required: true,
          minLength: 3,
          maxLength: 100,
          ancho: "completo",
        },
        { name: "descripcion", label: "Descripcion", type: "textarea", ancho: "completo" },
        {
          name: "estado",
          label: "Estado",
          options: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
          ],
          ancho: "completo",
        },
      ]}
    />
  );
}
