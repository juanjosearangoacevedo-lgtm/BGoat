import { Users } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { endpoints } from "@/shared/services/endpoints";
import { formatFecha, nombreCompleto } from "@/shared/utils/formatters";
import { ejemploDocumento, normalizarDocumento, pistaDocumento } from "@/shared/validations";
import { crearOperarioEsquema } from "../validations/operarioValidation";

/**
 * Modulo Operarias -> tabla `operarios` (operarias y personal de planta).
 *
 * El cargo SUPERVISOR desaparecio: la jornada la configura la digitadora
 * desde la app, no una supervisora asignada a cada modulo.
 */
const cargos = ["OPERARIO", "MECANICO", "OTRO"];

export function OperariosPage() {
  return (
    <CrudPage
      titulo="Operarios"
      entidad="operario"
      ayudaCrear="El código (OP-001, OP-002…) lo asigna el sistema al guardar."
      subtitulo="Personal de planta"
      recurso={endpoints.operarios}
      idField="id_operario"
      etiquetaNuevo="Nuevo operario"
      busquedaPlaceholder="Buscar por código, nombre o documento..."
      nombreRegistro={(fila) => nombreCompleto(fila)}
      emptyIcon={Users}
      emptyTitle="No hay operarios registrados"
      emptyDescription="Registra el personal de planta para poder asignarlo a los módulos."
      ordenInicial={{ campo: "nombre", direccion: "asc" }}
      filtrosLista={[
        {
          clave: "estado",
          label: "Estado",
          etiquetaTodos: "Todos los estados",
          opciones: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
            { value: "RETIRADO", label: "Retirado" },
          ],
        },
        {
          clave: "cargo",
          label: "Cargo",
          etiquetaTodos: "Todos los cargos",
          opciones: cargos.map((cargo) => ({ value: cargo, label: cargo })),
        },
      ]}
      columnas={[
        { key: "codigo_operario", header: "Código" },
        {
          key: "nombre",
          header: "Nombre",
          sortValue: (fila) => nombreCompleto(fila),
          render: (fila) => nombreCompleto(fila),
        },
        {
          key: "numero_documento",
          header: "Documento",
          render: (fila) => `${fila.tipo_documento} ${fila.numero_documento}`,
        },
        { key: "cargo", header: "Cargo" },
        { key: "fecha_ingreso", header: "Ingreso", render: (fila) => formatFecha(fila.fecha_ingreso) },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{
        tipo_documento: "CC",
        numero_documento: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        correo: "",
        fecha_ingreso: "",
        cargo: "OPERARIO",
        estado: "ACTIVO",
      }}
      required={["numero_documento", "nombres", "apellidos", "fecha_ingreso"]}
      esquema={({ items, editing }) => crearOperarioEsquema({ lista: items, editing })}
      // Mismo orden en todo el panel: nombre, documento, contacto, lo propio
      // del modulo y al final el estado. El codigo no se pide: lo asigna el sistema.
      campos={[
        { name: "nombres", label: "Nombres", required: true, minLength: 2, maxLength: 60 },
        { name: "apellidos", label: "Apellidos", required: true, minLength: 2, maxLength: 60 },
        {
          name: "tipo_documento",
          label: "Tipo de documento",
          options: ["CC", "CE", "TI", "PASAPORTE", "OTRO"],
          required: true,
          // Lo que no cabe en el tipo nuevo (letras en una cédula) se quita del número.
          alCambiar: ({ valor, form, setField }) =>
            setField("numero_documento", normalizarDocumento(valor, form.numero_documento)),
        },
        {
          name: "numero_documento",
          label: "Número de documento",
          placeholder: (form) => ejemploDocumento(form.tipo_documento),
          hint: (form) => pistaDocumento(form.tipo_documento, form.numero_documento),
          required: true,
          normalizar: (valor, form) => normalizarDocumento(form.tipo_documento, valor),
        },
        { name: "correo", label: "Correo", type: "email", placeholder: "operario@empresa.com" },
        { name: "telefono", label: "Teléfono", type: "tel", placeholder: "300 000 0000" },
        { name: "cargo", label: "Cargo", options: cargos, required: true },
        { name: "fecha_ingreso", label: "Fecha de ingreso", type: "date", required: true },
        {
          name: "estado",
          label: "Estado",
          options: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
            { value: "RETIRADO", label: "Retirado" },
          ],
        },
      ]}
    />
  );
}
