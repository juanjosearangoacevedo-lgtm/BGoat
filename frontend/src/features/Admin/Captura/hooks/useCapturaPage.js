import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
import { hoyLocal } from "@/shared/utils/formatters";

/**
 * Rejilla de captura horaria -> tabla `registros_horarios`.
 *
 * Es la pantalla que usa la digitadora en su recorrido: una fila por
 * modulo, una columna por franja de la jornada.
 *
 * Un modulo solo se puede capturar si tiene jornada abierta: la jornada
 * es la que dice que lote se esta produciendo y con cuantas operarias, y
 * de ahi sale el SAM. Los modulos sin jornada llegan igual en la rejilla
 * (con `tiene_jornada: false`) para que la pantalla ofrezca abrirla.
 *
 * Las franjas las manda el backend (`jornada_franjas`) y no son todas de
 * 60 minutos: de martes a viernes la ultima dura 40 y el sabado 20. Por
 * eso aqui no hay ningun 60 escrito: el ancho de la franja llega con los
 * datos y de ahi sale la meta.
 */
export function useCapturaPage({ fechaInicial = null } = {}) {
  const [fecha, setFecha] = useState(() => fechaInicial || hoyLocal());
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
          // Ya no se digita un total: se reparte por talla y color, y el
          // total es la suma de ese reparto (ver `calculoActivo`).
          detalle_talla_color: existente?.detalle_talla_color ?? [],
          unidades_defectuosas: existente?.unidades_defectuosas ?? 0,
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

  /** Reemplaza el reparto completo por talla y color de la celda activa. */
  const actualizarDetalleTallaColor = (filas) => {
    setCeldaActiva((previo) =>
      previo ? { ...previo, valores: { ...previo.valores, detalle_talla_color: filas } } : previo,
    );
  };

  /**
   * Cuanto le queda a cada combinacion del lote, pero contando esta misma
   * celda como si no se hubiera capturado todavia -si no, al reabrir una
   * hora ya guardada el limite se veria mas chico de lo que realmente es,
   * porque su propio aporte ya esta contado como "capturado".
   */
  const restanteTallaColor = useMemo(() => {
    if (!celdaActiva) return [];
    const base = celdaActiva.modulo.desglose_talla_color ?? [];
    const propios = celdaActiva.existente?.detalle_talla_color ?? [];
    const propioDe = (idTalla, idColor) =>
      propios.find(
        (fila) => String(fila.id_talla ?? "") === String(idTalla ?? "") &&
          String(fila.id_color ?? "") === String(idColor ?? ""),
      )?.cantidad ?? 0;

    return base.map((fila) => ({
      ...fila,
      restante: fila.restante + propioDe(fila.id_talla, fila.id_color),
    }));
  }, [celdaActiva]);

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
   * Calculos en vivo mientras la digitadora digita.
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
    const producidas = (celdaActiva.valores.detalle_talla_color ?? []).reduce(
      (total, fila) => total + Number(fila.cantidad || 0),
      0,
    );
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
    if (!rejilla) {
      return { registradas: 0, totales: 0, pendientes: 0, porcentaje: 0, sinJornada: 0 };
    }

    const registradas = rejilla.resumen?.celdas_registradas ?? 0;
    const totales = rejilla.resumen?.celdas_totales ?? 0;

    const suma = (campo) =>
      (rejilla.modulos ?? []).reduce((total, m) => total + Number(m.resumen?.[campo] || 0), 0);

    const facturacionMeta = suma("facturacion_meta");
    const facturacionReal = suma("facturacion_real");

    return {
      registradas,
      totales,
      sinJornada: rejilla.resumen?.modulos_sin_jornada ?? 0,
      conJornada: rejilla.resumen?.modulos_con_jornada ?? 0,
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
    restanteTallaColor,
    guardando,
    abrirCelda,
    cerrarCelda,
    actualizarValor,
    actualizarDetalleTallaColor,
    actualizarMinutosPerdidos,
    guardarCelda,
    recargar: cargar,
  };
}
