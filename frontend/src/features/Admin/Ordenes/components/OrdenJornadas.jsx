import { CalendarDays, UserCircle2, Users } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFecha } from "@/shared/utils/formatters";

/**
 * Los dias que la digitadora trabajo esta orden (tabla `jornada_modulo`).
 *
 * Reemplaza al panel de materiales de la ficha tecnica, que era un listado
 * transcrito a mano y que nadie consultaba. Esto si se consulta: dice con
 * cuanta gente se saco la orden cada dia, que es la mitad de la
 * explicacion cuando la eficiencia no cuadra.
 */
export function OrdenJornadas({ jornadas = [] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-[#0F4C3F]" />
        <h3 className="font-bold text-gray-900">Jornadas trabajadas</h3>
      </div>

      {jornadas.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          compacto
          title="Sin jornadas registradas"
          description="Ningun modulo ha abierto jornada con esta orden todavia."
        />
      ) : (
        <ul className="divide-y divide-gray-50">
          {jornadas.map((jornada) => {
            const anonimas = jornada.cantidad_operarias - jornada.operarias_identificadas;

            return (
              <li
                key={jornada.id_jornada_modulo}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{formatFecha(jornada.fecha)}</p>
                  <p className="text-xs text-gray-400">
                    {jornada.estado === "ABIERTA" ? "En curso" : "Cerrada"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1" title="Operarias en el modulo">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {jornada.cantidad_operarias}
                  </span>
                  {anonimas > 0 && (
                    <span className="flex items-center gap-1 text-gray-400" title="Operarias anonimas">
                      <UserCircle2 className="h-3.5 w-3.5" />
                      {anonimas} anonimas
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
