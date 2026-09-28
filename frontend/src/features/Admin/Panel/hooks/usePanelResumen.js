import { useEffect, useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Resumen del Panel.
 *
 * Antes traia ocho endpoints para alimentar graficas (produccion por
 * modulo, top operarias, produccion por cliente, tendencia) que quedaron
 * fuera del resumen por repetir lo que ya dice el semaforo de eficiencia.
 * Solo quedan los dos que la pestana Resumen usa de verdad:
 *   KPIs del dia   -> vw_estado_planta_hora / vw_estado_modulo_dia
 *   Estado de planta -> /indicadores/estado-modulos
 */
export function usePanelResumen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState({});
  const [production, setProduction] = useState([]);

  useEffect(() => {
    let activo = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpis, modulos] = await Promise.all([
          apiClient.get(endpoints.resumen),
          apiClient.get(endpoints.estadoModulos),
        ]);

        if (!activo) return;

        setResumen(kpis || {});
        setProduction(modulos?.datos ?? []);
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

  return { loading, error, summary: resumen, production };
}
