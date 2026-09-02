import { kpiDefinitions } from "../hooks/useIndicadoresPage";

export function IndicadoresKpis({ kpis = {} }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpiDefinitions.map((definition) => {
        const valor = kpis[definition.key];

        return (
          <div key={definition.key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{definition.label}</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: definition.color }}>
              {valor === undefined || valor === null
                ? "--"
                : `${Number(valor).toLocaleString("es-CO")}${definition.sufijo || ""}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
