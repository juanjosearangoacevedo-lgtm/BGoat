import { Card } from "@/shared/components/card";
import { kpiDefinitions } from "../hooks/useDashboardPage";

export function KPICards({ metrics = {} }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpiDefinitions.map((kpi) => {
        const Icon = kpi.icon;
        const valor = metrics[kpi.key];

        return (
          <Card key={kpi.key} className="border border-gray-100 bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-2 text-sm text-gray-600">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {valor === undefined || valor === null
                    ? "--"
                    : Number(valor).toLocaleString("es-CO")}
                </p>
                <p className="mt-1 text-xs text-gray-500">{kpi.unit}</p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${kpi.color}15` }}
              >
                <Icon className="h-6 w-6" style={{ color: kpi.color }} />
              </div>
            </div>

          </Card>
        );
      })}
    </div>
  );
}
