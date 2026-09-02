import { PageHeader } from "@/shared/components/PageHeader";
import { IndicadoresGraficos } from "../components/IndicadoresGraficos";
import { IndicadoresKpis } from "../components/IndicadoresKpis";
import { IndicadoresResumenModulos } from "../components/IndicadoresResumenModulos";
import { IndicadoresSam } from "../components/IndicadoresSam";
import { dateFilters, useIndicadoresPage } from "../hooks/useIndicadoresPage";

export function IndicadoresPage() {
  const { dateFilter, setDateFilter, kpis, charts, modules, sam, totalMinutosPerdidos, loading, error } =
    useIndicadoresPage();

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Indicadores" subtitle="Eficiencia, cumplimiento y tiempo perdido de la planta">
        <div className="flex gap-2">
          {dateFilters.map((filtro) => (
            <button
              key={filtro.value}
              onClick={() => setDateFilter(filtro.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                dateFilter === filtro.value
                  ? "bg-[#433A9B] text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
              type="button"
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <IndicadoresKpis kpis={kpis} />

      <IndicadoresGraficos charts={charts} totalMinutosPerdidos={totalMinutosPerdidos} />

      <IndicadoresResumenModulos modules={modules} loading={loading} />

      <IndicadoresSam datos={sam} loading={loading} />
    </div>
  );
}
