import { CalendarOff } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { endpoints } from "@/shared/services/endpoints";
import { formatFecha } from "@/shared/utils/formatters";
import { crearDiaNoLaboralEsquema } from "../validations/diaNoLaboralValidation";

/**
 * Calendario de festivos y cierres -> tabla `dias_no_laborales`.
 *
 * Antes el sistema solo sabia que domingo no se trabaja (por la ausencia
 * de fila en `jornada_dia`); estas son fechas sueltas que se restan al
 * estimar cuando estaria lista una orden (ver `useOrdenForm.js`). Se
 * carga una vez con el calendario del año y se ajusta si hace falta.
 */
export function DiasNoLaboralesPage() {
  return (
    <CrudPage
      titulo="Dias no laborales"
      subtitulo="Festivos y cierres que se restan al estimar fechas de entrega"
      recurso={endpoints.diasNoLaborales}
      idField="fecha"
      etiquetaNuevo="Nueva fecha"
      busquedaPlaceholder="Buscar por descripcion..."
      nombreRegistro={(fila) => (fila?.descripcion ? fila.descripcion : "esa fecha")}
      emptyIcon={CalendarOff}
      emptyTitle="No hay fechas configuradas"
      emptyDescription="Sin festivos cargados, la estimacion de fechas los va a contar como dias habiles."
      ordenInicial={{ campo: "fecha", direccion: "asc" }}
      permiteEstado={false}
      columnas={[
        { key: "fecha", header: "Fecha", render: (fila) => formatFecha(fila.fecha) },
        { key: "descripcion", header: "Descripcion" },
      ]}
      emptyForm={{ fecha: "", descripcion: "" }}
      required={["fecha"]}
      esquema={({ items, editing }) => crearDiaNoLaboralEsquema({ lista: items, editing })}
      campos={[
        { name: "fecha", label: "Fecha", type: "date", required: true },
        {
          name: "descripcion",
          label: "Descripcion",
          placeholder: "Dia de la Independencia",
          maxLength: 100,
          ancho: "completo",
        },
      ]}
    />
  );
}
