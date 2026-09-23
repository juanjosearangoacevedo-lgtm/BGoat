import { useEffect, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Tablero principal.
 *
 * Todo se calcula en la base de datos:
 *   KPIs y produccion del dia -> vw_estado_planta_hora / vw_estado_modulo_dia
 *   Estado de planta          -> /indicadores/estado-modulos
 *   Series                    -> /indicadores/*
 */
export function usePanelResumen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState({});
  const [production, setProduction] = useState([]);
  const [charts, setCharts] = useState({
    plantaHora: [],
    productividadPorModulo: [],
    topOperarios: [],
    produccionPorCliente: [],
    tendencia: [],
  });
  const [ordenesRiesgo, setOrdenesRiesgo] = useState([]);

  useEffect(() => {
    let activo = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpis, modulos, planta, porModulo, operarios, clientes, tendencia, riesgo] =
          await Promise.all([
            apiClient.get(endpoints.resumen),
            apiClient.get(endpoints.estadoModulos),
            apiClient.get(endpoints.plantaHora),
            apiClient.get(withQuery(endpoints.productividadModulo, { periodo: "mes" })),
            apiClient.get(withQuery(endpoints.productividadOperario, { periodo: "mes" })),
            apiClient.get(endpoints.produccionCliente),
            apiClient.get(withQuery(endpoints.tendencia, { periodo: "mes" })),
            apiClient.get(endpoints.ordenesRiesgo),
          ]);

        if (!activo) return;

        setResumen(kpis || {});
        setProduction(modulos?.datos ?? []);
        setOrdenesRiesgo(riesgo?.datos ?? []);
        setCharts({
          plantaHora: planta?.datos ?? [],
          productividadPorModulo: porModulo?.datos ?? [],
          topOperarios: (operarios?.datos ?? []).slice(0, 8),
          produccionPorCliente: clientes?.datos ?? [],
          tendencia: tendencia?.datos ?? [],
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
  }, []);

  return {
    loading,
    error,
    summary: resumen,
    metrics: resumen,
    production,
    charts,
    ordenesRiesgo,
  };
}
