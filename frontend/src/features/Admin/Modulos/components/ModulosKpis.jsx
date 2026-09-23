import { Banknote, Clock, Target, TrendingUp, Users } from "lucide-react";
import { formatMoneda, formatNumero } from "@/shared/utils/formatters";

/**
 * El cierre del dia de la planta, con las mismas cifras que la fila de
 * totales del tablero de la empresa: unidades contra meta, eficiencia,
 * pesos contra pesos y el tiempo que se perdio.
 *
 * Ninguna se digita. Todas salen de `vw_estado_modulo_dia` a traves de
 * GET /indicadores/estado-modulos.
 */
export function ModulosKpis({ totals = {} }) {
  const cards = [
    {
      label: "Producido hoy",
      value: formatNumero(totals.producido),
      nota: `de ${formatNumero(totals.metaDia)} de meta`,
      icon: Target,
      color: "text-[#0F4C3F]",
      bg: "bg-[#0F4C3F]/10",
    },
    {
      label: "Eficiencia de planta",
      value: `${totals.eficiencia ?? 0}%`,
      nota: `${formatNumero(totals.minutosGanados)} de ${formatNumero(totals.minutosDisponibles)} min`,
      icon: TrendingUp,
      color: "text-[#D08E10]",
      bg: "bg-[#D08E10]/10",
    },
    {
      label: "Facturacion real",
      value: formatMoneda(totals.facturacionReal),
      nota: `meta ${formatMoneda(totals.facturacionMeta)}`,
      icon: Banknote,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Cumplimiento facturacion",
      value: `${totals.cumplimientoFacturacion ?? 0}%`,
      nota: "pesos reales sobre pesos meta",
      icon: Banknote,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Operarias en planta",
      value: `${totals.operariosAsignados ?? 0}/${totals.capacidad ?? 0}`,
      nota: `${totals.modulos ?? 0} modulos`,
      icon: Users,
      color: "text-[#0F4C3F]",
      bg: "bg-[#0F4C3F]/10",
    },
    {
      label: "Minutos-persona perdidos",
      value: formatNumero(totals.minutosPerdidos),
      // El horario sale de las franjas, no de un campo del modulo.
      nota: totals.horasHorario ? `jornada de ${totals.horasHorario} h` : "sin jornada hoy",
      icon: Clock,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="truncate text-xs text-gray-500">{card.label}</span>
            </div>
            <div className={`truncate text-lg font-bold ${card.color}`} title={String(card.value)}>
              {card.value}
            </div>
            <div className="truncate text-[11px] text-gray-400" title={card.nota}>
              {card.nota}
            </div>
          </div>
        );
      })}
    </div>
  );
}
