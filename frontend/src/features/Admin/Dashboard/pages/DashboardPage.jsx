import { HeroSection } from "../components/HeroSection";
import { OrdenesRiesgo } from "../components/OrdenesRiesgo";
import { KPICards } from "../components/KPICards";
import { ProductionTable } from "../components/ProductionTable";
import { ProductivityCharts } from "../components/ProductivityCharts";
import { useDashboardPage } from "../hooks/useDashboardPage";

export function DashboardPage({ onNavigate }) {
  const { summary, metrics, production, charts, loading, error, ordenesRiesgo } = useDashboardPage();

  return (
    <div className="space-y-8 p-8">
      <HeroSection summary={summary} onNavigate={onNavigate} />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <KPICards metrics={metrics} />
      <ProductionTable rows={production} loading={loading} />
      <OrdenesRiesgo ordenes={ordenesRiesgo} onNavigate={onNavigate} />
      <ProductivityCharts charts={charts} />
    </div>
  );
}
