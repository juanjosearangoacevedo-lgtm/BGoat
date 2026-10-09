import { Palette } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { endpoints } from "@/shared/services/endpoints";
import { crearColorEsquema } from "../validations/colorValidation";

/** Catalogo de colores -> tabla `colores`, usado por el desglose del lote. */
export function ColoresPage() {
  return (
    <CrudPage
      titulo="Colores"
      subtitulo="El catálogo que usa el desglose de cada lote"
      recurso={endpoints.colores}
      idField="id_color"
      etiquetaNuevo="Nuevo color"
      busquedaPlaceholder="Buscar por nombre..."
      nombreRegistro={(fila) => (fila?.nombre ? `el color ${fila.nombre}` : "el color")}
      emptyIcon={Palette}
      emptyTitle="No hay colores configurados"
      emptyDescription="Sin colores, el desglose del lote no tiene de donde escoger."
      ordenInicial={{ campo: "nombre", direccion: "asc" }}
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
      ]}
      columnas={[
        {
          key: "nombre",
          header: "Color",
          render: (fila) => (
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-gray-200"
                style={{ backgroundColor: fila.codigo_hex || "#FFFFFF" }}
              />
              {fila.nombre}
            </span>
          ),
        },
        { key: "codigo_hex", header: "Hex" },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{ nombre: "", codigo_hex: "#000000", estado: "ACTIVO" }}
      required={["nombre"]}
      esquema={({ items, editing }) => crearColorEsquema({ lista: items, editing })}
      campos={[
        { name: "nombre", label: "Nombre", placeholder: "Verde oliva", required: true, maxLength: 50 },
        {
          name: "codigo_hex",
          label: "Color",
          type: "color",
          hint: "El que se ve en el selector del desglose.",
        },
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
