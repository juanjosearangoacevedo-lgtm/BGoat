import { useEffect, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

const SIN_DATOS = { cargando: false, datos: null, error: null };

/**
 * En que puesto de la cola quedaria una orden nueva del lote `idLote`.
 *
 * La prioridad no se digita: es la posicion de la orden entre las que no han
 * terminado, ordenadas por la fecha de recepcion de su lote. Este hook le pide
 * al backend ese mismo calculo con la orden todavia por crear, para mostrarlo
 * mientras se llena el formulario:
 *
 *   datos -> { posicion, total, ordenesAntes, totalDesplazadas,
 *              desplazadas: [{ numero_orden, prioridad_actual, prioridad_nueva }] }
 *
 * Se vuelve a pedir cada vez que cambia el lote. Sin lote (o `null`) no pide nada.
 */
export function usePrioridadEstimada(idLote) {
  const [estado, setEstado] = useState(SIN_DATOS);

  useEffect(() => {
    if (!idLote) {
      setEstado(SIN_DATOS);
      return undefined;
    }

    const control = new AbortController();
    setEstado({ cargando: true, datos: null, error: null });

    apiClient
      .get(withQuery(endpoints.prioridadEstimada, { id_lote: idLote }), { signal: control.signal })
      .then((datos) => setEstado({ cargando: false, datos, error: null }))
      .catch((problema) => {
        if (problema.name === "AbortError") return;
        setEstado({ cargando: false, datos: null, error: problema.message });
      });

    return () => control.abort();
  }, [idLote]);

  return estado;
}
