import { Card } from "@/shared/components/card";
import { summaryDefinitions } from "../hooks/useReportesPage";

export function ReportesResumen({ summary = {} }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Resumen de Indicadores</h3>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
        {summaryDefinitions.map((definition) => {
          const valor = summary[definition.key];

          return (
            <div key={definition.key} className="text-center">
              <p className="mb-1 text-sm text-gray-600">{definition.label}</p>
              <p className="text-3xl font-bold" style={{ color: definition.color }}>
                {valor === undefined || valor === null
                  ? "--"
                  : `${Number(valor).toLocaleString("es-CO")}${definition.sufijo || ""}`}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
