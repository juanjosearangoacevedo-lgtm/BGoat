import { AlertTriangle } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";
import { GUION } from "@/shared/utils/formatters";
import { NuevoResponsable } from "../components/NuevoResponsable";
import { crearCausaEsquema } from "../validations/causaValidation";

/**
 * Modulo Causas -> tabla `causas_desviacion`.
 * Es el catalogo que la digitadora ve como botones cuando una hora no
 * alcanza la meta. `tipo` separa lo planeado, lo interno y lo del cliente.
 *
 * El `codigo` ES el nombre de la causa; la `descripcion` es la
 * explicacion larga y es opcional. El responsable se escoge del catalogo
 * `responsables` (y si falta, se agrega desde el mismo formulario).
 */
const tipos = [
  { value: "PLANEADA", label: "Planeada (se sabía que iba a pasar)" },
  { value: "INTERNA", label: "Interna (responsabilidad de la empresa)" },
  { value: "EXTERNA", label: "Externa (del cliente, es negociable)" },
];

const tiposFiltro = [
  { value: "PLANEADA", label: "Planeada" },
  { value: "INTERNA", label: "Interna" },
  { value: "EXTERNA", label: "Externa" },
];

export function CausasPage() {
  const responsables = useCatalogo(endpoints.responsables, {
    valor: "id_responsable",
    etiqueta: "nombre",
    filtros: { estado: "ACTIVO" },
  });

  return (
    <CrudPage
      titulo="Causas de desviación"
      subtitulo="Motivos por los que una hora no alcanza la meta"
      recurso={endpoints.causas}
      idField="id_causa"
      etiquetaNuevo="Nueva causa"
      busquedaPlaceholder="Buscar por código, descripción o responsable..."
      nombreRegistro={(fila) => (fila?.codigo ? `la causa ${fila.codigo}` : "la causa")}
      emptyIcon={AlertTriangle}
      emptyTitle="No hay causas configuradas"
      emptyDescription="Sin causas, la digitadora no puede explicar por qué una hora quedó por debajo de la meta."
      ordenInicial={{ campo: "orden_visual", direccion: "asc" }}
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
        { clave: "tipo", label: "Tipo", etiquetaTodos: "Todos los tipos", opciones: tiposFiltro },
        {
          clave: "id_responsable",
          label: "Responsable",
          etiquetaTodos: "Todos los responsables",
          opciones: responsables.options,
          comparar: (fila, valor) => String(fila.id_responsable ?? "") === String(valor),
        },
        {
          clave: "requiere_nota",
          label: "Nota",
          etiquetaTodos: "Pide nota o no",
          opciones: [
            { value: "1", label: "Exige nota" },
            { value: "0", label: "Sin nota" },
          ],
          comparar: (fila, valor) => String(Number(fila.requiere_nota || 0)) === String(valor),
        },
      ]}
      columnas={[
        { key: "codigo", header: "Código" },
        {
          key: "descripcion",
          header: "Descripción",
          render: (fila) => fila.descripcion || <span className="text-gray-300">{GUION}</span>,
          exportar: (fila) => fila.descripcion || "",
        },
        { key: "tipo", header: "Tipo" },
        {
          key: "nombre_responsable",
          header: "Responsable",
          render: (fila) => fila.nombre_responsable || <span className="text-gray-300">{GUION}</span>,
          exportar: (fila) => fila.nombre_responsable || "",
        },
        {
          key: "requiere_nota",
          header: "Pide nota",
          align: "center",
          render: (fila) => (Number(fila.requiere_nota) === 1 ? "Si" : "No"),
        },
        { key: "orden_visual", header: "Orden", align: "center" },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{
        codigo: "",
        descripcion: "",
        tipo: "INTERNA",
        id_responsable: "",
        requiere_nota: "0",
        orden_visual: "1",
        estado: "ACTIVO",
      }}
      required={["codigo", "tipo"]}
      esquema={({ items, editing }) =>
        crearCausaEsquema({ lista: items, editing, responsableOptions: responsables.options })
      }
      transformarPayload={(datos) => ({
        ...datos,
        descripcion: String(datos.descripcion || "").trim() || null,
        id_responsable: datos.id_responsable ? Number(datos.id_responsable) : null,
        requiere_nota: Number(datos.requiere_nota) ? 1 : 0,
        orden_visual: Number(datos.orden_visual || 1),
      })}
      campos={[
        {
          name: "codigo",
          label: "Código",
          placeholder: "Daño de máquina",
          required: true,
          maxLength: 100,
          hint: "Es el nombre de la causa: lo que la digitadora ve en el botón.",
        },
        { name: "tipo", label: "Tipo", options: tipos, required: true },
        {
          name: "descripcion",
          label: "Descripción",
          type: "textarea",
          rows: 2,
          placeholder: "Qué significa esta causa y cuándo se usa",
          maxLength: 255,
          ancho: "completo",
        },
        {
          name: "id_responsable",
          label: "Responsable",
          options: responsables.options,
          emptyOption: "Sin responsable",
          extra: ({ setField }) => (
            <NuevoResponsable
              onCreado={(id) => {
                responsables.recargar();
                if (id) setField("id_responsable", String(id));
              }}
            />
          ),
        },
        {
          name: "requiere_nota",
          label: "Exige nota",
          options: [
            { value: "0", label: "No" },
            { value: "1", label: "Si" },
          ],
          hint: "Si la exige, la digitadora debe escribir el detalle.",
        },
        {
          name: "orden_visual",
          label: "Orden en pantalla",
          type: "number",
          min: 1,
          max: 99,
          hint: "Define en qué posición aparece el botón.",
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
