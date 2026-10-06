import { diasEntre, formatFecha, formatNumero } from "@/shared/utils/formatters";

/** Avance de la orden segun `vw_avance_orden`. */
export function OrdenProgresoHero({ orden, progress = 0 }) {
  const dias = diasEntre(orden?.fecha_inicio_programada, orden?.fecha_fin_programada);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-marca to-marca-medio p-6 text-white">
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
        <div className="h-full rounded-full bg-dorado transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-white/60">
        {/* Inicio = primera jornada con la orden; entrega = formula de
            German desde ese dia, fija (`backend/src/lib/plan.js`). */}
        <span>
          Inicio:{" "}
          {orden?.fecha_inicio_real ? formatFecha(orden.fecha_inicio_real) : "al iniciar jornada"}
        </span>
        <span>Defectuosas: {formatNumero(orden?.unidades_defectuosas)}</span>
        <span>
          Entrega:{" "}
          {orden?.fecha_fin_programada
            ? formatFecha(orden.fecha_fin_programada)
            : orden?.fecha_inicio_real
              ? "falta la eficiencia esperada"
              : "se calcula al iniciar jornada"}
        </span>
        {dias && <span>Duracion: {dias} dia{dias === 1 ? "" : "s"}</span>}
      </div>

      {/* `dias_atraso` sale sola de `jornada_modulo`: el ultimo dia que un
          modulo trabajo esta orden, comparado con la fecha en que debia
          estar lista. Solo se muestra si ya hubo algun dia de trabajo. */}
      {orden?.ultimo_dia_trabajado && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-xs">
          <span className="text-white/60">
            Ultimo dia trabajado: {formatFecha(orden.ultimo_dia_trabajado)}
          </span>
          {Number(orden.dias_atraso) > 0 ? (
            <span className="rounded-full bg-peligro/25 px-2.5 py-1 font-semibold text-white">
              +{orden.dias_atraso} {Number(orden.dias_atraso) === 1 ? "dia" : "dias"} de atraso
            </span>
          ) : (
            <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold text-white">
              A tiempo
            </span>
          )}
        </div>
      )}
    </div>
  );
}
