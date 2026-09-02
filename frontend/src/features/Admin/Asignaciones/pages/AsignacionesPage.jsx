import { ClipboardList } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";
import { formatFecha, nombreCompleto } from "@/shared/utils/formatters";
import { crearAsignacionEsquema } from "../validations/asignacionValidation";

/**
 * Modulo Asignacion de personal operativo -> tabla `asignaciones_modulo`.
 * Define quien trabaja en que modulo y con que rol. De aqui sale el
 * supervisor de cada modulo y la atribucion de produccion por operario.
 */
const estados = [
  { value: "PROGRAMADA", label: "Programada" },
  { value: "ACTIVA", label: "Activa" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const turnos = ["MANANA", "TARDE", "NOCHE", "MIXTO"];
const rolesModulo = ["OPERARIO", "SUPERVISOR", "MECANICO"];

export function AsignacionesPage() {
  const modulos = useCatalogo(endpoints.modulos, {
    valor: "id_modulo",
    etiqueta: (fila) => `${fila.codigo} - ${fila.nombre}`,
  });
  const operarios = useCatalogo(endpoints.operarios, {
    valor: "id_operario",
    etiqueta: (fila) => `${fila.codigo_operario} - ${fila.nombres} ${fila.apellidos}`,
    filtros: { estado: "ACTIVO" },
  });

  const conHora = (valor, hora) => {
    if (!valor) return null;
    return String(valor).length === 10 ? `${valor} ${hora}` : valor;
  };

  return (
    <CrudPage
      titulo="Asignacion operativa"
      subtitulo="Personal asignado a cada modulo"
      recurso={endpoints.asignaciones}
      idField="id_asignacion"
      etiquetaNuevo="Nueva asignacion"
      busquedaPlaceholder="Buscar por observaciones..."
      permiteEstado={false}
      nombreRegistro={(fila) =>
        fila ? `${nombreCompleto(fila)} en ${fila.codigo_modulo}` : "la asignacion"
      }
      emptyIcon={ClipboardList}
      emptyTitle="No hay asignaciones registradas"
      emptyDescription="Asigna operarias a los modulos para saber quien trabaja en cada uno."
      ordenInicial={{ campo: "fecha_inicio", direccion: "desc" }}
      filtrosLista={[
        { clave: "estado", label: "Estado", etiquetaTodos: "Todos los estados", opciones: estados },
        {
          clave: "id_modulo",
          label: "Modulo",
          etiquetaTodos: "Todos los modulos",
          opciones: modulos.options,
        },
        {
          clave: "turno",
          label: "Turno",
          etiquetaTodos: "Todos los turnos",
          opciones: turnos.map((turno) => ({ value: turno, label: turno })),
        },
        {
          clave: "rol_asignacion",
          label: "Rol",
          etiquetaTodos: "Todos los roles",
          opciones: rolesModulo.map((rol) => ({ value: rol, label: rol })),
        },
      ]}
      columnas={[
        { key: "codigo_modulo", header: "Modulo" },
        {
          key: "operario",
          header: "Operario",
          sortValue: (fila) => nombreCompleto(fila),
          render: (fila) => nombreCompleto(fila),
        },
        { key: "rol_asignacion", header: "Rol" },
        { key: "turno", header: "Turno" },
        { key: "fecha_inicio", header: "Desde", render: (fila) => formatFecha(fila.fecha_inicio) },
        { key: "fecha_fin", header: "Hasta", render: (fila) => formatFecha(fila.fecha_fin) },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{
        id_modulo: "",
        id_operario: "",
        fecha_inicio: "",
        fecha_fin: "",
        turno: "MANANA",
        rol_asignacion: "OPERARIO",
        estado: "ACTIVA",
        observaciones: "",
      }}
      required={["id_modulo", "id_operario", "fecha_inicio", "turno"]}
      esquema={crearAsignacionEsquema({
        moduloOptions: modulos.options,
        operarioOptions: operarios.options,
      })}
      transformarPayload={(datos) => ({
        ...datos,
        id_modulo: Number(datos.id_modulo),
        id_operario: Number(datos.id_operario),
        fecha_inicio: conHora(datos.fecha_inicio, "06:00:00"),
        fecha_fin: conHora(datos.fecha_fin, "18:00:00"),
      })}
      campos={[
        {
          name: "id_modulo",
          label: "Modulo",
          options: modulos.options,
          emptyOption: "Seleccionar modulo",
          required: true,
        },
        {
          name: "id_operario",
          label: "Operario",
          options: operarios.options,
          emptyOption: "Seleccionar operario",
          required: true,
        },
        { name: "rol_asignacion", label: "Rol en el modulo", options: rolesModulo, required: true },
        { name: "turno", label: "Turno", options: turnos, required: true },
        { name: "fecha_inicio", label: "Fecha de inicio", type: "date", required: true },
        {
          name: "fecha_fin",
          label: "Fecha de fin",
          type: "date",
          hint: "Opcional: dejar vacio si la asignacion sigue abierta.",
        },
        { name: "estado", label: "Estado", options: estados, required: true },
        { name: "observaciones", label: "Observaciones", type: "textarea", ancho: "completo" },
      ]}
    />
  );
}
