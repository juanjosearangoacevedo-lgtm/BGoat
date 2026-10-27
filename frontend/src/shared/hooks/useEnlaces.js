import { useEffect, useState } from "react";
import { apiClient } from "@/shared/services/apiClient";

const SIN_DATOS = { cargando: false, info: null, error: null };

/**
 * A que esta enlazado un registro (lotes que usan a un cliente, jornadas
 * abiertas de un modulo...). Pide `GET <recurso>/<id>/enlaces` apenas hay un
 * registro; con `recurso` o `id` vacios no pide nada.
 *
 *   info -> { bloqueado, mensaje, ayuda, total, enlaces: [{ tipo, titulo, detalle }],
 *             borra, yaInactivo }
 *
 * Es solo una consulta: lo que de verdad impide eliminar es el backend, que
 * vuelve a revisar al recibir el DELETE.
 */
export function useEnlaces(recurso, id) {
  const [estado, setEstado] = useState(SIN_DATOS);

  useEffect(() => {
    if (!recurso || id === null || id === undefined) {
      setEstado(SIN_DATOS);
      return undefined;
    }

    const control = new AbortController();
    setEstado({ cargando: true, info: null, error: null });

    apiClient
      .get(`${recurso}/${id}/enlaces`, { signal: control.signal })
      .then((info) => setEstado({ cargando: false, info, error: null }))
      .catch((problema) => {
        if (problema.name === "AbortError") return;
        setEstado({ cargando: false, info: null, error: problema.message });
      });

    return () => control.abort();
  }, [recurso, id]);

  return estado;
}
