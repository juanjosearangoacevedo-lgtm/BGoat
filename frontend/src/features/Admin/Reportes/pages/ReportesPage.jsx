import { Download, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { exportarCSV } from "@/shared/utils/exportar";
import { ReportesFiltros } from "../components/ReportesFiltros";
import { ReportesGraficos } from "../components/ReportesGraficos";
import { ReportesResumen } from "../components/ReportesResumen";
import { useReportesPage } from "../hooks/useReportesPage";

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

export function ReportesPage() {
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
  } = useReportesPage();

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
    <div className="space-y-6 p-8">
      <PageHeader
        title="Reportes y Dashboards"
        subtitle="Analisis detallado de productividad y eficiencia"
      >
        <Button variant="outline" className="gap-2 no-print" onClick={exportarExcel}>
          <FileDown className="h-4 w-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" className="gap-2 no-print" onClick={exportarPdf}>
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <ReportesFiltros
        filters={filters}
        moduloOptions={moduloOptions}
        onPeriod={setPeriod}
        onModulo={setIdModulo}
        onFechaInicio={setFechaInicio}
        onFechaFin={setFechaFin}
      />

      <ReportesGraficos charts={charts} />

      <ReportesResumen summary={summary} />
    </div>
  );
}
