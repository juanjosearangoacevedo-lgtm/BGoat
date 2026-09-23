import { AlertTriangle } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { endpoints } from "@/shared/services/endpoints";
import { crearCausaEsquema } from "../validations/causaValidation";

/**
 * Modulo Causas -> tabla `causas_desviacion`.
 * Es el catalogo que la digitadora ve como botones cuando una hora no
 * alcanza la meta. `tipo` separa lo planeado, lo interno y lo del cliente.
 */
const tipos = [
  { value: "PLANEADA", label: "Planeada (se sabia que iba a pasar)" },
  { value: "INTERNA", label: "Interna (responsabilidad de la empresa)" },
  { value: "EXTERNA", label: "Externa (del cliente, es negociable)" },
];

const tiposFiltro = [
  { value: "PLANEADA", label: "Planeada" },
  { value: "INTERNA", label: "Interna" },
  { value: "EXTERNA", label: "Externa" },
];

export function CausasPage() {
  return (
    <CrudPage
      titulo="Causas de desviacion"
      subtitulo="Motivos por los que una hora no alcanza la meta"
      recurso={endpoints.causas}
      idField="id_causa"
      etiquetaNuevo="Nueva causa"
      busquedaPlaceholder="Buscar por codigo, nombre o responsable..."
      nombreRegistro={(fila) => (fila?.nombre ? `la causa ${fila.nombre}` : "la causa")}
      emptyIcon={AlertTriangle}
      emptyTitle="No hay causas configuradas"
      emptyDescription="Sin causas, la digitadora no puede explicar por que una hora quedo por debajo de la meta."
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
        { key: "codigo", header: "Codigo" },
        { key: "nombre", header: "Causa" },
        { key: "tipo", header: "Tipo" },
        { key: "responsable", header: "Responsable" },
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
        nombre: "",
        tipo: "INTERNA",
        responsable: "",
        requiere_nota: "0",
        orden_visual: "1",
        estado: "ACTIVO",
      }}
      required={["codigo", "nombre", "tipo"]}
      esquema={({ items, editing }) => crearCausaEsquema({ lista: items, editing })}
      transformarPayload={(datos) => ({
        ...datos,
        requiere_nota: Number(datos.requiere_nota) ? 1 : 0,
        orden_visual: Number(datos.orden_visual || 1),
      })}
      campos={[
        {
          name: "codigo",
          label: "Codigo",
          placeholder: "MONTAJE",
          required: true,
          maxLength: 30,
          hint: "Corto y en mayusculas.",
        },
        {
          name: "nombre",
          label: "Nombre",
          placeholder: "Montaje / cambio de referencia",
          required: true,
          minLength: 3,
          maxLength: 80,
        },
        { name: "tipo", label: "Tipo", options: tipos, required: true },
        { name: "responsable", label: "Responsable", placeholder: "Produccion", maxLength: 60 },
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
          hint: "Define en que posicion aparece el boton.",
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
