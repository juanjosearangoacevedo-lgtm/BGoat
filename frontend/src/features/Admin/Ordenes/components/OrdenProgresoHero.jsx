import { formatFecha, formatNumero } from "@/shared/utils/formatters";

/** Avance de la orden segun `vw_avance_orden`. */
export function OrdenProgresoHero({ orden, progress = 0 }) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#0F4C3F] to-[#1B6B55] p-6 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">Progreso general</p>
          <p className="text-4xl font-bold">{progress}%</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/70">Unidades</p>
          <p className="text-2xl font-bold">
            {formatNumero(orden?.unidades_producidas)}{" "}
            <span className="text-lg text-white/60">/ {formatNumero(orden?.cantidad_programada)}</span>
          </p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-[#D08E10] transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-white/60">
        <span>Inicio programado: {formatFecha(orden?.fecha_inicio_programada)}</span>
        <span>Defectuosas: {formatNumero(orden?.cantidad_defectuosa)}</span>
        <span>Fin programado: {formatFecha(orden?.fecha_fin_programada)}</span>
      </div>
    </div>
  );
}
