import { Factory, Target, TrendingUp, User } from "lucide-react";
import { formatNumero } from "@/shared/utils/formatters";

/** KPIs agregados de `modulos` + `vw_estado_modulo_hoy`. */
export function ModulosKpis({ totals = {} }) {
  const cards = [
    {
      label: "Total modulos",
      value: totals.modulos ?? 0,
      icon: Factory,
      color: "text-[#433A9B]",
      bg: "bg-[#433A9B]/10",
    },
    {
      label: "Operarios asignados",
      value: `${totals.operariosAsignados ?? 0}/${totals.capacidad ?? 0}`,
      icon: User,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Cumplimiento de meta",
      value: `${totals.cumplimiento ?? 0}%`,
      icon: TrendingUp,
      color: "text-[#F39A3D]",
      bg: "bg-[#F39A3D]/10",
    },
    {
      label: "Producido hoy",
      value: formatNumero(totals.producido),
      icon: Target,
      color: "text-[#433A9B]",
      bg: "bg-[#433A9B]/10",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
