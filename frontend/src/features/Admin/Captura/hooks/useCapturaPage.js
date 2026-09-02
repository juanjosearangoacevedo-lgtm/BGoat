import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/** Fecha de hoy en formato YYYY-MM-DD, en hora local. */
export function hoyLocal() {
  const ahora = new Date();
  const desfase = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - desfase).toISOString().slice(0, 10);
}

/**
 * Rejilla de captura horaria -> tabla `registros_horarios`.
 *
 * Es la pantalla que usa la supervisora en su recorrido: una fila por
 * modulo, una columna por franja de la jornada.
 *
 * Las franjas las manda el backend (`jornada_franjas`) y no son todas de
 * 60 minutos: de martes a viernes la ultima dura 40 y el sabado 20. Por
 * eso aqui no hay ningun 60 escrito: el ancho de la franja llega con los
 * datos y de ahi sale la meta.
 */
export function useCapturaPage() {
  const [fecha, setFecha] = useState(hoyLocal);
  const [rejilla, setRejilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [celdaActiva, setCeldaActiva] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setRejilla(await apiClient.get(withQuery(endpoints.captura, { fecha })));
    } catch (problema) {
      setError(problema.message);
      setRejilla(null);
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Abre el formulario de una celda con los valores precargados. */
  const abrirCelda = useCallback(
    (modulo, franja) => {
      const existente = modulo.celdas?.[franja.orden_franja] || null;

      setCeldaActiva({
        modulo,
        franja,
        existente,
        valores: {
          personas_presentes: existente?.personas_presentes ?? modulo.personas_sugeridas ?? 0,
          unidades_producidas: existente?.unidades_producidas ?? 0,
          unidades_defectuosas: existente?.unidades_defectuosas ?? 0,
          id_causa: existente?.id_causa ?? "",
          nota: existente?.nota ?? "",
          // { [id_causa]: minutos } — el detalle de por que se paro el modulo.
          minutos_perdidos: Object.fromEntries(
            (existente?.minutos_perdidos_detalle ?? []).map((linea) => [
              linea.id_causa,
              linea.minutos,
            ]),
          ),
        },
      });
    },
    [],
  );

  const cerrarCelda = () => setCeldaActiva(null);

  const actualizarValor = (campo, valor) => {
    setCeldaActiva((previo) =>
      previo ? { ...previo, valores: { ...previo.valores, [campo]: valor } } : previo,
    );
  };

  /** Minutos perdidos de una causa. En 0 la causa desaparece del registro. */
  const actualizarMinutosPerdidos = (idCausa, minutos) => {
    setCeldaActiva((previo) => {
      if (!previo) return previo;
      const siguiente = { ...previo.valores.minutos_perdidos };
      const valor = Math.max(Number(minutos) || 0, 0);
      if (valor > 0) siguiente[idCausa] = valor;
      else delete siguiente[idCausa];
      return { ...previo, valores: { ...previo.valores, minutos_perdidos: siguiente } };
    });
  };

  /** Guarda la celda. El backend calcula meta, cumplimiento, SAM y pesos. */
  const guardarCelda = useCallback(async () => {
    if (!celdaActiva) return false;

    const { minutos_perdidos, ...valores } = celdaActiva.valores;

    setGuardando(true);
    try {
      await apiClient.put(endpoints.captura, {
        id_modulo: celdaActiva.modulo.id_modulo,
        fecha,
        hora_jornada: celdaActiva.franja.orden_franja,
        ...valores,
        id_causa: valores.id_causa || null,
        nota: valores.nota || null,
        minutos_perdidos: Object.entries(minutos_perdidos).map(([id_causa, minutos]) => ({
          id_causa: Number(id_causa),
          minutos,
        })),
      });

      toast.success(`${celdaActiva.modulo.codigo} · ${celdaActiva.franja.etiqueta} guardada`);
      setCeldaActiva(null);
      await cargar();
      return true;
    } catch (problema) {
      toast.error(problema.message);
      return false;
    } finally {
      setGuardando(false);
    }
  }, [celdaActiva, fecha, cargar]);

  /**
   * Calculos en vivo mientras la supervisora digita.
   *
   * Repiten lo que hace `vw_registro_horario` para que la pantalla
   * responda sin ir al servidor; el numero que queda guardado siempre es
   * el de la base.
   */
  const calculoActivo = useMemo(() => {
    if (!celdaActiva) return null;

    const sam = Number(celdaActiva.existente?.sam_aplicado ?? celdaActiva.modulo.sam_sugerido ?? 0);
    const precio = Number(
      celdaActiva.existente?.precio_aplicado ?? celdaActiva.modulo.precio_sugerido ?? 0,
    );
    const personas = Number(celdaActiva.valores.personas_presentes || 0);
    const producidas = Number(celdaActiva.valores.unidades_producidas || 0);
    const minutosFranja = Number(celdaActiva.franja.minutos || 0);

    const minutos = personas * minutosFranja;
    const meta = sam > 0 ? minutos / sam : 0;
    const cumplimiento = meta > 0 ? (producidas * 100) / meta : 0;
    const umbral = Number(celdaActiva.modulo.umbral_cumplimiento || 85);

    const perdidos = Object.values(celdaActiva.valores.minutos_perdidos).reduce(
      (total, valor) => total + Number(valor || 0),
      0,
    );

    return {
      sam,
      precio,
      minutosFranja,
      minutos,
      meta: Number(meta.toFixed(2)),
      cumplimiento: Number(cumplimiento.toFixed(1)),
      umbral,
      bajoUmbral: meta > 0 && cumplimiento < umbral,
      samObservado: producidas > 0 ? Number((minutos / producidas).toFixed(2)) : null,
      facturacionMeta: Number((meta * precio).toFixed(0)),
      facturacionReal: Number((producidas * precio).toFixed(0)),
      minutosPerdidos: perdidos,
      minutosPerdidosPersona: perdidos * personas,
      // No se puede perder mas tiempo del que dura la franja.
      excedePerdidos: perdidos > minutosFranja,
    };
  }, [celdaActiva]);

  const resumen = useMemo(() => {
    if (!rejilla) return { registradas: 0, totales: 0, pendientes: 0, porcentaje: 0 };

    const registradas = rejilla.resumen?.celdas_registradas ?? 0;
    const totales = rejilla.resumen?.celdas_totales ?? 0;

    const suma = (campo) =>
      (rejilla.modulos ?? []).reduce((total, m) => total + Number(m.resumen?.[campo] || 0), 0);

    const facturacionMeta = suma("facturacion_meta");
    const facturacionReal = suma("facturacion_real");

    return {
      registradas,
      totales,
      pendientes: Math.max(totales - registradas, 0),
      porcentaje: totales > 0 ? Math.round((registradas * 100) / totales) : 0,
      unidades: suma("unidades_producidas"),
      facturacionMeta,
      facturacionReal,
      cumplimientoFacturacion:
        facturacionMeta > 0 ? Number(((facturacionReal * 100) / facturacionMeta).toFixed(1)) : null,
      minutosPerdidos: suma("minutos_perdidos_persona"),
    };
  }, [rejilla]);

  const esHoy = fecha === hoyLocal();

  return {
    fecha,
    setFecha,
    esHoy,
    rejilla,
    jornada: rejilla?.jornada ?? null,
    cargando,
    error,
    resumen,
    celdaActiva,
    calculoActivo,
    guardando,
    abrirCelda,
    cerrarCelda,
    actualizarValor,
    actualizarMinutosPerdidos,
    guardarCelda,
    recargar: cargar,
  };
}
