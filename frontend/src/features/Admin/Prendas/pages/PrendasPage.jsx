import { Shirt } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";
import { crearPrendaEsquema } from "../validations/prendaValidation";

/**
 * Modulo Prendas -> tabla `prendas`.
 * Una prenda es la combinacion referencia + tipo + talla + color (el SKU).
 * La produccion se mide por referencia; este catalogo sirve para distribuir
 * la cantidad de una orden por talla y color.
 */
export function PrendasPage() {
  const referencias = useCatalogo(endpoints.referencias, {
    valor: "id_referencia",
    etiqueta: (fila) => `${fila.codigo} - ${fila.nombre}`,
    filtros: { estado: "ACTIVO" },
  });
  const tipos = useCatalogo(endpoints.tiposPrenda, { valor: "id_tipo_prenda", etiqueta: "nombre" });
  const tallas = useCatalogo(endpoints.tallas, { valor: "id_talla", etiqueta: "nombre" });
  const colores = useCatalogo(endpoints.colores, { valor: "id_color", etiqueta: "nombre" });

  return (
    <CrudPage
      titulo="Prendas"
      subtitulo="Catalogo de SKU por referencia, talla y color"
      recurso={endpoints.prendas}
      idField="id_prenda"
      etiquetaNuevo="Nueva prenda"
      busquedaPlaceholder="Buscar por SKU, nombre o descripcion..."
      nombreRegistro={(fila) => (fila?.sku ? `la prenda ${fila.sku}` : "la prenda")}
      emptyIcon={Shirt}
      emptyTitle="No hay prendas en el catalogo"
      emptyDescription="Las prendas se usan para distribuir la cantidad de una orden por talla y color."
      ordenInicial={{ campo: "sku", direccion: "asc" }}
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
          clave: "id_referencia",
          label: "Referencia",
          etiquetaTodos: "Todas las referencias",
          opciones: referencias.options,
        },
        {
          clave: "id_tipo_prenda",
          label: "Tipo",
          etiquetaTodos: "Todos los tipos",
          opciones: tipos.options,
        },
        { clave: "id_talla", label: "Talla", etiquetaTodos: "Todas las tallas", opciones: tallas.options },
      ]}
      columnas={[
        { key: "sku", header: "SKU" },
        { key: "nombre", header: "Nombre" },
        { key: "codigo_referencia", header: "Referencia" },
        { key: "nombre_tipo_prenda", header: "Tipo" },
        { key: "nombre_talla", header: "Talla", align: "center" },
        {
          key: "nombre_color",
          header: "Color",
          render: (fila) => (
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full border border-gray-200"
                style={{ backgroundColor: fila.codigo_hex || "transparent" }}
              />
              {fila.nombre_color}
            </span>
          ),
          exportar: (fila) => fila.nombre_color,
        },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{
        id_referencia: "",
        id_tipo_prenda: "",
        id_talla: "",
        id_color: "",
        sku: "",
        nombre: "",
        descripcion: "",
        estado: "ACTIVO",
      }}
      required={["id_referencia", "id_tipo_prenda", "id_talla", "id_color", "sku", "nombre"]}
      esquema={({ items, editing }) =>
        crearPrendaEsquema({
          lista: items,
          editing,
          referenciaOptions: referencias.options,
          tipoOptions: tipos.options,
          tallaOptions: tallas.options,
          colorOptions: colores.options,
        })
      }
      transformarPayload={(datos) => ({
        ...datos,
        id_referencia: Number(datos.id_referencia),
        id_tipo_prenda: Number(datos.id_tipo_prenda),
        id_talla: Number(datos.id_talla),
        id_color: Number(datos.id_color),
      })}
      campos={[
        {
          name: "id_referencia",
          label: "Referencia",
          options: referencias.options,
          emptyOption: "Seleccionar",
          required: true,
          ancho: "completo",
        },
        {
          name: "id_tipo_prenda",
          label: "Tipo de prenda",
          options: tipos.options,
          emptyOption: "Seleccionar",
          required: true,
        },
        {
          name: "id_talla",
          label: "Talla",
          options: tallas.options,
          emptyOption: "Seleccionar",
          required: true,
        },
        {
          name: "id_color",
          label: "Color",
          options: colores.options,
          emptyOption: "Seleccionar",
          required: true,
        },
        {
          name: "sku",
          label: "SKU",
          placeholder: "9703-M-NEGRO",
          required: true,
          maxLength: 50,
          hint: "Debe ser unico en el catalogo.",
        },
        { name: "nombre", label: "Nombre", required: true, maxLength: 100, ancho: "completo" },
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
