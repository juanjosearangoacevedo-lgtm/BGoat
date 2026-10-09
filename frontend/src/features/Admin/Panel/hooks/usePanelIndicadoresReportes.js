import { useEffect, useMemo, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Pestana Indicadores y Reportes (fusion de las dos que eran antes).
 *
 * Un solo filtro de periodo + modulo gobierna todo lo que se ve: los
 * KPIs, la tendencia, el resumen por modulo, el Pareto de causas y el
 * SAM. Antes cada pestana tenia su propio filtro y su propia copia de la
 * tendencia y del resumen de KPIs, mostrando el mismo numero dos veces
 * bajo dos nombres distintos.
 */
export const periodOptions = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mes" },
  { value: "anio", label: "Este Año" },
  { value: "personalizado", label: "Personalizado" },
];

export function usePanelIndicadoresReportes() {
  const [period, setPeriod] = useState("mes");
  const [idModulo, setIdModulo] = useState("all");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState({});
  const [modules, setModules] = useState([]);
  const [sam, setSam] = useState([]);
  const [totalMinutosPerdidos, setTotalMinutosPerdidos] = useState(0);
  const [charts, setCharts] = useState({
    tendencia: [],
    causas: [],
  });

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
        const [resumen, porModulo, causas, tendencia, samData] = await Promise.all([
          apiClient.get(withQuery(endpoints.resumen, parametros)),
          apiClient.get(withQuery(endpoints.productividadModulo, parametros)),
          apiClient.get(withQuery(endpoints.causasPareto, parametros)),
          apiClient.get(withQuery(endpoints.tendencia, parametros)),
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
    kpis,
    modules,
    sam,
    totalMinutosPerdidos,
    charts,
  };
}
