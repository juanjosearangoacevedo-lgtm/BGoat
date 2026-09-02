import { useEffect, useMemo, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Modulo Reportes y Dashboards.
 *
 * Los filtros viajan al backend con los nombres de columna reales:
 * `id_modulo`, `periodo` y el rango de fechas.
 */
export const periodOptions = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mes" },
  { value: "anio", label: "Este Ano" },
  { value: "personalizado", label: "Personalizado" },
];

export const summaryDefinitions = [
  { key: "eficiencia", label: "Eficiencia", color: "#433A9B", sufijo: "%" },
  { key: "minutos_por_prenda", label: "SAM Real", color: "#F39A3D", sufijo: " min" },
  { key: "produccion_mes", label: "Produccion del Mes", color: "#433A9B" },
  { key: "porcentaje_defectos", label: "Tasa de Defectos", color: "#dc2626", sufijo: "%" },
  { key: "cumplimiento_meta", label: "Cumplimiento", color: "#0891b2", sufijo: "%" },
];

export function useReportesPage() {
  const [period, setPeriod] = useState("mes");
  const [idModulo, setIdModulo] = useState("all");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [charts, setCharts] = useState({
    productividadPorModulo: [],
    productividadPorOperario: [],
    produccionPorMarca: [],
    tendencia: [],
  });
  const [summary, setSummary] = useState({});

  const modulos = useCatalogo(endpoints.modulos, {
    valor: "id_modulo",
    etiqueta: (fila) => fila.codigo + " - " + fila.nombre,
  });

  const consulta = useMemo(
    () => ({
      periodo: period,
      id_modulo: idModulo === "all" ? undefined : idModulo,
      fecha_inicio: period === "personalizado" ? fechaInicio || undefined : undefined,
      fecha_fin: period === "personalizado" ? fechaFin || undefined : undefined,
    }),
    [period, idModulo, fechaInicio, fechaFin],
  );

  const consultaSerializada = JSON.stringify(consulta);

  useEffect(() => {
    let activo = true;
    const parametros = JSON.parse(consultaSerializada);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [porModulo, porOperario, marcas, tendencia, resumen] = await Promise.all([
          apiClient.get(withQuery(endpoints.productividadModulo, parametros)),
          apiClient.get(withQuery(endpoints.productividadOperario, parametros)),
          apiClient.get(endpoints.produccionMarca),
          apiClient.get(withQuery(endpoints.tendencia, parametros)),
          apiClient.get(endpoints.resumen),
        ]);

        if (!activo) return;

        setCharts({
          productividadPorModulo: porModulo?.datos ?? [],
          productividadPorOperario: porOperario?.datos ?? [],
          produccionPorMarca: marcas?.datos ?? [],
          tendencia: tendencia?.datos ?? [],
        });
        setSummary(resumen || {});
      } catch (problema) {
        if (activo) setError(problema.message);
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [consultaSerializada]);

  return {
    loading,
    error,
    filters: { period, idModulo, fechaInicio, fechaFin },
    setPeriod,
    setIdModulo,
    setFechaInicio,
    setFechaFin,
    moduloOptions: modulos.options,
    charts,
    summary,
  };
}
