import { useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Button } from "@/shared/components/button";
import { formatFecha } from "@/shared/utils/formatters";

/**
 * La entrega de la orden y la decision de German cuando cambian las
 * personas (ver `backend/src/lib/plan.js`).
 *
 * La entrega se calcula una sola vez, el dia en que la orden inicia
 * jornada, con la formula de German, y queda FIJA. Si en una jornada
 * posterior se declaran otras personas, aqui aparece el aviso y German
 * decide: ajustar la eficiencia esperada (la entrega se recalcula desde
 * el mismo inicio y vuelve a quedar fija) o dejarla como esta.
 */
export function OrdenAvisoEntrega({ orden, decidiendo, onDecidir }) {
  const [ajustando, setAjustando] = useState(false);
  const [eficiencia, setEficiencia] = useState(orden?.eficiencia_esperada ? Number(orden.eficiencia_esperada) : "");

  if (!orden || orden.estado === "FINALIZADO") return null;

  const personasEntrega = Number(orden.personas_entrega || 0);
  const personasAhora = Number(orden.personas_ultima_jornada || 0);
  const cambiaronPersonas =
    Boolean(orden.fecha_fin_programada) &&
    personasEntrega > 0 &&
    personasAhora > 0 &&
    personasAhora !== personasEntrega &&
    personasAhora !== Number(orden.personas_aviso_visto || 0);

  // Todavia en cola: solo tiene prioridad.
  if (!orden.fecha_inicio_real) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
        <CalendarClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
        <p className="text-gray-600">
          En cola con prioridad <strong>#{orden.prioridad}</strong>. La entrega se calcula el día
          en que un módulo inicie jornada con esta orden.
        </p>
      </div>
    );
  }

  // Arranco pero sin eficiencia esperada (o sin SAM): no hay entrega todavia.
  if (!orden.fecha_fin_programada) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dorado/30 bg-dorado/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-dorado-texto" />
        <p className="text-dorado-texto">
          Inicio jornada el {formatFecha(orden.fecha_inicio_real)}, pero falta la eficiencia
          esperada (o el SAM del lote): sin eso no se puede calcular la entrega. Se calcula sola
          apenas se llene.
        </p>
      </div>
    );
  }

  if (!cambiaronPersonas) return null;

  return (
    <div className="rounded-2xl border border-dorado/30 bg-dorado/5 p-4 text-sm">
      <p className="flex items-start gap-2 font-medium text-dorado-texto">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Cambio el número de personas ({personasEntrega} → {personasAhora}). ¿Ajustar la eficiencia
        esperada?
      </p>
      <p className="mt-1 pl-6 text-xs text-gray-600">
        La entrega ({formatFecha(orden.fecha_fin_programada)}) se calculo con {personasEntrega}{" "}
        personas al {Number(orden.eficiencia_esperada)}%. Si ajustas, se recalcula desde el inicio (
        {formatFecha(orden.fecha_inicio_real)}) con {personasAhora} personas y vuelve a quedar fija.
      </p>

      {ajustando ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
          <label className="text-xs text-gray-600" htmlFor="eficiencia-ajuste">
            Eficiencia esperada (%)
          </label>
          <input
            id="eficiencia-ajuste"
            type="number"
            min={1}
            max={100}
            value={eficiencia}
            onChange={(evento) => setEficiencia(evento.target.value)}
            className="h-9 w-20 rounded-lg border border-gray-200 px-2 text-sm outline-none focus:border-marca"
          />
          <Button
            size="sm"
            disabled={decidiendo || !(Number(eficiencia) > 0 && Number(eficiencia) <= 100)}
            onClick={() => onDecidir?.("ajustar", Number(eficiencia))}
            className="bg-marca text-white hover:bg-marca-oscuro"
          >
            {decidiendo ? "Recalculando..." : "Recalcular entrega"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAjustando(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2 pl-6">
          <Button
            size="sm"
            onClick={() => setAjustando(true)}
            className="bg-dorado text-white hover:bg-dorado-hover"
          >
            Ajustar
          </Button>
          <Button size="sm" variant="outline" disabled={decidiendo} onClick={() => onDecidir?.("dejar")}>
            Dejar como está
          </Button>
        </div>
      )}
    </div>
  );
}
