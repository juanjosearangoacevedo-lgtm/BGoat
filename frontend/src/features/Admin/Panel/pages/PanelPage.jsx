import { useState } from "react";
import { Download, FileDown, Gauge, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { exportarCSV } from "@/shared/utils/exportar";
import { EficienciaModulos } from "../components/EficienciaModulos";
import { PanelFiltros } from "../components/PanelFiltros";
import { PanelHero } from "../components/PanelHero";
import { KPIS_INDICADORES_REPORTES, PanelKpis } from "../components/PanelKpis";
import { ResumenModulos } from "../components/ResumenModulos";
import { TablaCausas } from "../components/TablaCausas";
import { TablaSam } from "../components/TablaSam";
import { TendenciaEficienciaChart, TendenciaUnidadesChart } from "../components/TendenciaChart";
import { usePanelIndicadoresReportes } from "../hooks/usePanelIndicadoresReportes";
import { usePanelResumen } from "../hooks/usePanelResumen";

/**
 * Panel de analisis.
 *
 * Reemplaza a Dashboard, Indicadores y Reportes, que eran tres entradas
 * de menu distintas leyendo las mismas vistas (`vw_estado_modulo_dia`,
 * `vw_avance_orden`, `vw_perdidas_por_causa`) y respondiendo a la misma
 * pregunta con tres pantallas.
 *
 * Indicadores y Reportes terminaron siendo la misma pregunta dos veces
 * --el mismo resumen de KPIs, la misma tendencia, la misma produccion
 * por modulo-- bajo dos filtros de fecha independientes que ademas no
 * movian las tarjetas de arriba. Se fusionaron en una sola pestana con
 * un filtro compartido; lo unico que tenia cada una y la otra no
 * (Pareto de causas y SAM real de Indicadores; exportar de Reportes) se
 * quedo, sin repetirse. "Top operarias" y "Produccion por cliente" se
 * quitaron: el cliente del sistema no necesita ese desglose.
 */
const PESTANAS = [
  { clave: "resumen", label: "Resumen", icono: LayoutDashboard },
  { clave: "indicadores-reportes", label: "Indicadores y Reportes", icono: Gauge },
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
    <div className="rounded-2xl border border-peligro/25 bg-peligro/10 p-4 text-sm text-peligro">
      {mensaje}
    </div>
  );
}

function PestanaResumen({ onNavigate }) {
  const { summary, production, loading, error } = usePanelResumen();

  return (
    <div className="space-y-8">
      <PanelHero summary={summary} modules={production} onNavigate={onNavigate} />
      <Aviso mensaje={error} />
      <EficienciaModulos modules={production} loading={loading} onNavigate={onNavigate} />
    </div>
  );
}

function PestanaIndicadoresReportes() {
  const {
    filters,
    setPeriod,
    setIdModulo,
    setFechaInicio,
    setFechaFin,
    moduloOptions,
    kpis,
    modules,
    sam,
    totalMinutosPerdidos,
    charts,
    loading,
    error,
  } = usePanelIndicadoresReportes();

  const filas = modules || [];

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

      <PanelFiltros
        filters={filters}
        moduloOptions={moduloOptions}
        onPeriod={setPeriod}
        onModulo={setIdModulo}
        onFechaInicio={setFechaInicio}
        onFechaFin={setFechaFin}
      />

      <Aviso mensaje={error} />

      <PanelKpis valores={kpis} claves={KPIS_INDICADORES_REPORTES} conIcono={false} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TendenciaEficienciaChart data={charts.tendencia} />
        <TendenciaUnidadesChart data={charts.tendencia} />
      </div>

      <ResumenModulos modules={modules} loading={loading} />

      <TablaCausas
        datos={charts.causas}
        totalMinutosPerdidos={totalMinutosPerdidos}
        loading={loading}
      />

      <TablaSam datos={sam} loading={loading} />
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
        <nav className="flex gap-1 rounded-xl border border-linea bg-white p-1 no-print">
          {PESTANAS.map((entrada) => {
            const Icono = entrada.icono;
            const activa = pestana === entrada.clave;

            return (
              <button
                key={entrada.clave}
                type="button"
                onClick={() => setPestana(entrada.clave)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activa ? "bg-ambar text-white" : "text-texto-suave hover:bg-fondo"
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
      {pestana === "indicadores-reportes" && <PestanaIndicadoresReportes />}
    </div>
  );
}
