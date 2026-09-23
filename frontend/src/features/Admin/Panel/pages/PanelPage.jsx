import { useState } from "react";
import { BarChart3, Download, FileDown, Gauge, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { exportarCSV } from "@/shared/utils/exportar";
import { GraficosIncidencias } from "../components/GraficosIncidencias";
import { OrdenesRiesgo } from "../components/OrdenesRiesgo";
import { PanelFiltros } from "../components/PanelFiltros";
import { PanelGraficos } from "../components/PanelGraficos";
import { PanelHero } from "../components/PanelHero";
import { KPIS_INDICADORES, PanelKpis } from "../components/PanelKpis";
import { PanelResumen } from "../components/PanelResumen";
import { ProductionTable } from "../components/ProductionTable";
import { ResumenModulos } from "../components/ResumenModulos";
import { TablaSam } from "../components/TablaSam";
import { usePanelIndicadores, dateFilters } from "../hooks/usePanelIndicadores";
import { usePanelReportes } from "../hooks/usePanelReportes";
import { usePanelResumen } from "../hooks/usePanelResumen";

/**
 * Panel de analisis.
 *
 * Reemplaza a Dashboard, Indicadores y Reportes, que eran tres entradas
 * de menu distintas leyendo las mismas vistas (`vw_estado_modulo_dia`,
 * `vw_estado_planta_hora`, `vw_avance_orden`, `vw_perdidas_por_causa`) y
 * respondiendo a la misma pregunta con tres pantallas. Aqui son tres
 * pestanas de una sola.
 *
 * Cada pestana monta su hook solo cuando esta activa: las tres piden
 * cosas distintas al servidor y traerlas todas de entrada seria pagar
 * tres veces por lo que casi siempre se mira una.
 */
const PESTANAS = [
  { clave: "resumen", label: "Resumen", icono: LayoutDashboard },
  { clave: "indicadores", label: "Indicadores", icono: Gauge },
  { clave: "reportes", label: "Reportes", icono: BarChart3 },
];

/**
 * Columnas del archivo de productividad por modulo.
 * Son las mismas que alimentan el grafico, para que el archivo y la
 * pantalla no puedan contar cosas distintas.
 */
const columnasModulo = [
  { key: "codigo_modulo", header: "Modulo" },
  { key: "nombre_modulo", header: "Nombre" },
  { key: "total_producido", header: "Unidades producidas" },
  { key: "total_defectuoso", header: "Unidades defectuosas" },
  { key: "porcentaje_defectos", header: "% defectos" },
  { key: "minutos_disponibles", header: "Minutos disponibles" },
  { key: "minutos_ganados", header: "Minutos ganados" },
  { key: "eficiencia", header: "% eficiencia" },
];

function Aviso({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {mensaje}
    </div>
  );
}

function PestanaResumen({ onNavigate }) {
  const { summary, metrics, production, charts, loading, error, ordenesRiesgo } = usePanelResumen();

  return (
    <div className="space-y-8">
      <PanelHero summary={summary} onNavigate={onNavigate} />
      <Aviso mensaje={error} />
      <PanelKpis valores={metrics} />
      <ProductionTable rows={production} loading={loading} />
      <OrdenesRiesgo ordenes={ordenesRiesgo} onNavigate={onNavigate} />
      <PanelGraficos charts={charts} tituloTendencia="Tendencia de eficiencia del mes" />
    </div>
  );
}

function PestanaIndicadores() {
  const {
    dateFilter,
    setDateFilter,
    kpis,
    charts,
    modules,
    sam,
    totalMinutosPerdidos,
    loading,
    error,
  } = usePanelIndicadores();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {dateFilters.map((filtro) => (
          <button
            key={filtro.value}
            onClick={() => setDateFilter(filtro.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              dateFilter === filtro.value
                ? "bg-[#0F4C3F] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
            type="button"
          >
            {filtro.label}
          </button>
        ))}
      </div>

      <Aviso mensaje={error} />
      <PanelKpis valores={kpis} claves={KPIS_INDICADORES} conIcono={false} />
      <GraficosIncidencias charts={charts} totalMinutosPerdidos={totalMinutosPerdidos} />
      <ResumenModulos modules={modules} loading={loading} />
      <TablaSam datos={sam} loading={loading} />
    </div>
  );
}

function PestanaReportes() {
  const {
    filters,
    setPeriod,
    setIdModulo,
    setFechaInicio,
    setFechaFin,
    moduloOptions,
    charts,
    summary,
    error,
  } = usePanelReportes();

  const filas = charts.productividadPorModulo || [];

  /** Excel abre el CSV directamente; no hace falta una libreria extra. */
  const exportarExcel = () => {
    const cantidad = exportarCSV({
      filas,
      columnas: columnasModulo,
      archivo: `reporte-productividad-${filters.period}`,
    });

    if (cantidad === 0) {
      toast.error("No hay datos en el periodo seleccionado para exportar");
      return;
    }
    toast.success(`Se exportaron ${cantidad} modulos`);
  };

  /**
   * El PDF sale del dialogo de impresion del navegador con "Guardar como
   * PDF". Es lo que ya sabe paginar los graficos tal como se ven.
   */
  const exportarPdf = () => {
    if (filas.length === 0) {
      toast.error("No hay datos en el periodo seleccionado para imprimir");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2 no-print">
        <Button variant="outline" className="gap-2" onClick={exportarExcel}>
          <FileDown className="h-4 w-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" className="gap-2" onClick={exportarPdf}>
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Aviso mensaje={error} />

      <PanelFiltros
        filters={filters}
        moduloOptions={moduloOptions}
        onPeriod={setPeriod}
        onModulo={setIdModulo}
        onFechaInicio={setFechaInicio}
        onFechaFin={setFechaFin}
      />

      <PanelGraficos charts={charts} tituloTendencia="Tendencia del periodo" />
      <PanelResumen summary={summary} />
    </div>
  );
}

export function PanelPage({ onNavigate }) {
  const [pestana, setPestana] = useState("resumen");

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Panel"
        subtitle="Como va la planta: resumen del dia, indicadores y reportes"
      >
        <nav className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 no-print">
          {PESTANAS.map((entrada) => {
            const Icono = entrada.icono;
            const activa = pestana === entrada.clave;

            return (
              <button
                key={entrada.clave}
                type="button"
                onClick={() => setPestana(entrada.clave)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activa ? "bg-[#0F4C3F] text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icono className="h-4 w-4" />
                {entrada.label}
              </button>
            );
          })}
        </nav>
      </PageHeader>

      {pestana === "resumen" && <PestanaResumen onNavigate={onNavigate} />}
      {pestana === "indicadores" && <PestanaIndicadores />}
      {pestana === "reportes" && <PestanaReportes />}
    </div>
  );
}
