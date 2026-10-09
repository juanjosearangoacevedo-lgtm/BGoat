import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";

/**
 * Detalle de una orden de produccion.
 *
 *   orden     -> vista `vw_avance_orden`
 *   registros -> vista `vw_registro_horario` (las horas capturadas)
 *   jornadas  -> tabla `jornada_modulo` (los dias que se trabajo la orden)
 *   curva     -> vista `vw_curva_arranque`
 *   lote      -> el lote de la orden, solo para enlazar su ficha tecnica
 *                (foto y PDF). Si el rol no puede ver lotes, queda en null.
 */
export function useOrdenDetalle(orderId) {
  const [orden, setOrden] = useState(null);
  const [curva, setCurva] = useState([]);
  const [lote, setLote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [decidiendo, setDecidiendo] = useState(false);

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

        // La ficha vive en el lote. Si no se puede leer (permiso), el
        // detalle de la orden sigue igual, solo sin los enlaces.
        const datosLote = datos?.id_lote
          ? await apiClient.get(`${endpoints.lotes}/${datos.id_lote}`).catch(() => null)
          : null;
        if (activo) setLote(datosLote);
      } catch (problema) {
        if (activo) setError(problema.message);
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [orderId, version]);

  /**
   * La decision de German sobre la entrega cuando cambiaron las personas:
   * "ajustar" (con la nueva eficiencia esperada) o "dejar".
   */
  const decidirEntrega = useCallback(
    async (accion, eficienciaEsperada) => {
      setDecidiendo(true);
      try {
        await apiClient.post(buildPath(endpoints.entregaOrden, { id: orderId }), {
          accion,
          eficiencia_esperada: eficienciaEsperada,
        });
        toast.success(accion === "ajustar" ? "Entrega recalculada" : "Se deja la entrega como está");
        setVersion((previa) => previa + 1);
      } catch (problema) {
        toast.error(problema.message);
      } finally {
        setDecidiendo(false);
      }
    },
    [orderId],
  );

  const progress = orden ? Math.min(Math.round(Number(orden.porcentaje_avance || 0)), 100) : 0;

  return {
    orderId,
    orden,
    registros: orden?.registros ?? [],
    jornadas: orden?.jornadas ?? [],
    curva,
    lote,
    loading,
    error,
    progress,
    decidiendo,
    decidirEntrega,
  };
}
