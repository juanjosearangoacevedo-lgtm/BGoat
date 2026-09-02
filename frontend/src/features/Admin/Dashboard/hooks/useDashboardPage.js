import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
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
export const kpiDefinitions = [
  { key: "produccion_dia", title: "Produccion del Dia", unit: "unidades", icon: Package, color: "#433A9B" },
  { key: "operarios_activos", title: "Operarios en Planta", unit: "personas", icon: Users, color: "#F39A3D" },
  { key: "ordenes_en_proceso", title: "Ordenes en Proceso", unit: "activas", icon: Clock, color: "#F3D33B" },
  { key: "eficiencia", title: "Eficiencia del Dia", unit: "% de minutos aprovechados", icon: Target, color: "#10b981" },
  { key: "cumplimiento_meta", title: "Cumplimiento de Meta", unit: "% de la meta del dia", icon: TrendingUp, color: "#06b6d4" },
  { key: "produccion_mes", title: "Producido en el Mes", unit: "unidades", icon: Calendar, color: "#8b5cf6" },
  { key: "porcentaje_defectos", title: "Porcentaje de Defectos", unit: "tasa", icon: AlertTriangle, color: "#ef4444" },
  { key: "minutos_por_prenda", title: "SAM Real Promedio", unit: "minutos por prenda", icon: Clock, color: "#f59e0b" },
];

export function useDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState({});
  const [production, setProduction] = useState([]);
  const [charts, setCharts] = useState({
    plantaHora: [],
    productividadPorModulo: [],
    topOperarios: [],
    produccionPorMarca: [],
    tendencia: [],
  });
  const [ordenesRiesgo, setOrdenesRiesgo] = useState([]);

  useEffect(() => {
    let activo = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpis, modulos, planta, porModulo, operarios, marcas, tendencia, riesgo] =
          await Promise.all([
            apiClient.get(endpoints.resumen),
            apiClient.get(endpoints.estadoModulos),
            apiClient.get(endpoints.plantaHora),
            apiClient.get(withQuery(endpoints.productividadModulo, { periodo: "mes" })),
            apiClient.get(withQuery(endpoints.productividadOperario, { periodo: "mes" })),
            apiClient.get(endpoints.produccionMarca),
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
          produccionPorMarca: marcas?.datos ?? [],
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
