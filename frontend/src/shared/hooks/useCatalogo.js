import { useEffect, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";

/**
 * Carga un catalogo del backend una sola vez y lo deja listo para un select.
 *
 *   const clientes = useCatalogo(endpoints.clientes, {
 *     valor: "id_cliente",
 *     etiqueta: (fila) => fila.nombre,
 *   });
 *   -> clientes.options = [{ value, label }]
 */
export function useCatalogo(recurso, { valor, etiqueta, filtros = {} } = {}) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const filtrosSerializados = JSON.stringify(filtros);

  useEffect(() => {
    let activo = true;

    (async () => {
      setCargando(true);
      try {
        const respuesta = await apiClient.get(
          withQuery(recurso, { porPagina: 500, ...JSON.parse(filtrosSerializados) }),
        );
        if (activo) setDatos(respuesta?.datos ?? []);
      } catch {
        if (activo) setDatos([]);
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [recurso, filtrosSerializados]);

  const options = datos.map((fila) => ({
    value: String(fila[valor]),
    label: typeof etiqueta === "function" ? etiqueta(fila) : fila[etiqueta],
  }));

  const buscar = (id) => datos.find((fila) => String(fila[valor]) === String(id)) || null;

  return { datos, options, cargando, buscar };
}
