import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";
import { hoyLocal } from "@/shared/utils/formatters";

/**
 * Tablero de un modulo en un dia -> `vw_tablero_modulo_dia`.
 *
 * Es la hoja de calculo que la empresa llena a mano, ya cuadrada: la
 * cabecera del modulo, una fila por franja con eficiencia, acumulado y
 * pesos, y el cierre del dia.
 *
 * Ningun numero se calcula aqui. Todos llegan de la vista, que es la
 * unica que sabe la formula: si la meta se recalculara en la pantalla,
 * el tablero y el dashboard podrian decir cosas distintas.
 */
export function useTableroModulo(idModuloInicial, fechaInicial) {
  const [idModulo, setIdModulo] = useState(idModuloInicial ?? null);
  const [fecha, setFecha] = useState(fechaInicial || hoyLocal());
  const [tablero, setTablero] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Lista de modulos para el selector: el jefe compara uno contra otro.
  // El endpoint responde `{ fecha, datos }`, no un arreglo suelto.
  useEffect(() => {
    apiClient
      .get(withQuery(endpoints.estadoModulos, { fecha }))
      .then((respuesta) => {
        const filas = respuesta?.datos ?? [];
        setModulos(filas);
        if (!idModulo && filas.length) setIdModulo(filas[0].id_modulo);
      })
      .catch(() => setModulos([]));
  }, [fecha, idModulo]);

  const cargar = useCallback(async () => {
    if (!idModulo) return;
    setCargando(true);
    setError(null);
    try {
      setTablero(
        await apiClient.get(
          withQuery(buildPath(endpoints.capturaModulo, { id: idModulo }), { fecha }),
        ),
      );
    } catch (problema) {
      setError(problema.message);
      setTablero(null);
    } finally {
      setCargando(false);
    }
  }, [idModulo, fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /**
   * Totales del dia.
   *
   * `vw_estado_modulo_dia` solo existe cuando hay al menos una franja
   * capturada; con el dia en blanco la vista no devuelve fila y aqui se
   * responde con ceros en vez de romper la pantalla.
   */
  const totales = useMemo(() => {
    const t = tablero?.totales;
    if (!t) {
      return {
        vacio: true,
        unidades_producidas: 0,
        meta_dia: 0,
        eficiencia: 0,
        facturacion_meta: 0,
        facturacion_real: 0,
        cumplimiento_facturacion: null,
        minutos_perdidos: 0,
        minutos_perdidos_persona: 0,
        franjas_registradas: 0,
      };
    }
    return {
      vacio: false,
      unidades_producidas: Number(t.unidades_producidas ?? 0),
      meta_dia: Number(t.meta_dia ?? 0),
      eficiencia: Number(t.eficiencia ?? 0),
      facturacion_meta: Number(t.facturacion_meta ?? 0),
      facturacion_real: Number(t.facturacion_real ?? 0),
      cumplimiento_facturacion:
        t.cumplimiento_facturacion === null ? null : Number(t.cumplimiento_facturacion),
      minutos_perdidos: Number(t.minutos_perdidos ?? 0),
      minutos_perdidos_persona: Number(t.minutos_perdidos_persona ?? 0),
      minutos_maquina: Number(t.minutos_maquina ?? 0),
      minutos_calidad: Number(t.minutos_calidad ?? 0),
      minutos_montaje: Number(t.minutos_montaje ?? 0),
      minutos_otras: Number(t.minutos_otras ?? 0),
      franjas_registradas: Number(t.horas_registradas ?? 0),
    };
  }, [tablero]);

  return {
    idModulo,
    setIdModulo,
    fecha,
    setFecha,
    modulos,
    tablero,
    cabecera: tablero?.cabecera ?? null,
    franjas: tablero?.franjas ?? [],
    jornada: tablero?.jornada ?? null,
    totales,
    cargando,
    error,
    recargar: cargar,
  };
}
