import { useEffect, useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";

/**
 * Detalle de una orden de produccion.
 *
 *   orden     -> vista `vw_avance_orden`
 *   registros -> vista `vw_registro_horario` (las horas capturadas)
 *   jornadas  -> tabla `jornada_modulo` (los dias que se trabajo la orden)
 *   curva     -> vista `vw_curva_arranque`
 */
export function useOrdenDetalle(orderId) {
  const [orden, setOrden] = useState(null);
  const [curva, setCurva] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return undefined;
    }

    let activo = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [datos, curvaDatos] = await Promise.all([
          apiClient.get(`${endpoints.ordenes}/${orderId}`),
          apiClient.get(buildPath(endpoints.curvaOrden, { id: orderId })),
        ]);
        if (!activo) return;
        setOrden(datos);
        setCurva(curvaDatos?.datos ?? []);
      } catch (problema) {
        if (activo) setError(problema.message);
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [orderId]);

  const progress = orden ? Math.min(Math.round(Number(orden.porcentaje_avance || 0)), 100) : 0;

  return {
    orderId,
    orden,
    registros: orden?.registros ?? [],
    jornadas: orden?.jornadas ?? [],
    curva,
    loading,
    error,
    progress,
  };
}
