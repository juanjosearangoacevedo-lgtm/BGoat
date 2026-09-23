import { useEffect, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Modulo Indicadores.
 *
 * Los cuatro indicadores que sostienen las decisiones de produccion:
 * eficiencia, produccion, defectos y el Pareto de tiempo perdido, mas la
 * comparacion SAM pactado vs observado que dice si el contrato deja plata.
 */
export const dateFilters = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mes" },
];

export function usePanelIndicadores() {
  const [dateFilter, setDateFilter] = useState("mes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({});
  const [modules, setModules] = useState([]);
  const [sam, setSam] = useState([]);
  const [charts, setCharts] = useState({
    tendencia: [],
    causas: [],
    estadoLotes: [],
    plantaHora: [],
  });
  const [totalMinutosPerdidos, setTotalMinutosPerdidos] = useState(0);

  useEffect(() => {
    let activo = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [resumen, porModulo, causas, lotes, tendencia, planta, samData] = await Promise.all([
          apiClient.get(endpoints.resumen),
          apiClient.get(withQuery(endpoints.productividadModulo, { periodo: dateFilter })),
          apiClient.get(withQuery(endpoints.causasPareto, { periodo: dateFilter })),
          apiClient.get(endpoints.lotesEstado),
          apiClient.get(withQuery(endpoints.tendencia, { periodo: dateFilter })),
          apiClient.get(endpoints.plantaHora),
          apiClient.get(endpoints.sam),
        ]);

        if (!activo) return;

        setKpis(resumen || {});
        setModules(porModulo?.datos ?? []);
        setSam(samData?.datos ?? []);
        setTotalMinutosPerdidos(causas?.total_minutos_perdidos ?? 0);
        setCharts({
          tendencia: tendencia?.datos ?? [],
          causas: causas?.datos ?? [],
          estadoLotes: lotes?.datos ?? [],
          plantaHora: planta?.datos ?? [],
        });
      } catch (problema) {
        if (activo) setError(problema.message);
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [dateFilter]);

  return {
    loading,
    error,
    dateFilter,
    setDateFilter,
    kpis,
    charts,
    modules,
    sam,
    totalMinutosPerdidos,
  };
}
