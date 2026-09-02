import { Users } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { endpoints } from "@/shared/services/endpoints";
import { formatFecha, nombreCompleto } from "@/shared/utils/formatters";
import { crearOperarioEsquema } from "../validations/operarioValidation";

/** Modulo Operarios -> tabla `operarios` (operarias, supervisoras y mecanicos). */
const cargos = ["OPERARIO", "SUPERVISOR", "MECANICO", "OTRO"];

export function OperariosPage() {
  return (
    <CrudPage
      titulo="Operarios"
      subtitulo="Personal de planta"
      recurso={endpoints.operarios}
      idField="id_operario"
      etiquetaNuevo="Nuevo operario"
      busquedaPlaceholder="Buscar por codigo, nombre o documento..."
      nombreRegistro={(fila) => nombreCompleto(fila)}
      emptyIcon={Users}
      emptyTitle="No hay operarios registrados"
      emptyDescription="Registra el personal de planta para poder asignarlo a los modulos."
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
        { key: "codigo_operario", header: "Codigo" },
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
        { key: "especialidad", header: "Especialidad" },
        { key: "fecha_ingreso", header: "Ingreso", render: (fila) => formatFecha(fila.fecha_ingreso) },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{
        codigo_operario: "",
        tipo_documento: "CC",
        numero_documento: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        correo: "",
        fecha_ingreso: "",
        cargo: "OPERARIO",
        especialidad: "",
        estado: "ACTIVO",
      }}
      required={["codigo_operario", "numero_documento", "nombres", "apellidos", "fecha_ingreso"]}
      esquema={({ items, editing }) => crearOperarioEsquema({ lista: items, editing })}
      campos={[
        { name: "codigo_operario", label: "Codigo", placeholder: "OP-001", required: true, maxLength: 20 },
        { name: "cargo", label: "Cargo", options: cargos, required: true },
        {
          name: "tipo_documento",
          label: "Tipo documento",
          options: ["CC", "CE", "TI", "PASAPORTE", "OTRO"],
          required: true,
        },
        {
          name: "numero_documento",
          label: "Numero documento",
          placeholder: "1234567890",
          required: true,
          minLength: 5,
          maxLength: 20,
        },
        { name: "nombres", label: "Nombres", required: true, minLength: 2, maxLength: 60 },
        { name: "apellidos", label: "Apellidos", required: true, minLength: 2, maxLength: 60 },
        { name: "telefono", label: "Telefono", type: "tel", placeholder: "300 000 0000" },
        { name: "correo", label: "Correo", type: "email", placeholder: "operario@empresa.com" },
        { name: "fecha_ingreso", label: "Fecha de ingreso", type: "date", required: true },
        { name: "especialidad", label: "Especialidad", placeholder: "Fileteadora", maxLength: 60 },
        {
          name: "estado",
          label: "Estado",
          options: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
            { value: "RETIRADO", label: "Retirado" },
          ],
          ancho: "completo",
        },
      ]}
    />
  );
}
