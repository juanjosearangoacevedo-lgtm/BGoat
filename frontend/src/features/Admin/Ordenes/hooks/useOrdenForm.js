import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
import { aFechaInput, diasEntre, hoyLocal } from "@/shared/utils/formatters";
import { calcularFechaEstimada } from "../utils/estimacionFecha";
import { validarOrden } from "../validations/ordenValidation";

/**
 * Formulario de orden de produccion -> tabla `ordenes_produccion`.
 *
 * La orden asigna un lote a un modulo. El SAM ya no se escoge aqui: viene
 * en el lote, que es donde llega la ficha tecnica del cliente. Por eso la
 * estimacion de capacidad se calcula con el SAM del lote elegido.
 *
 * `cantidad_programada` y `valor_maquila_unidad` tampoco se piden: un
 * lote corre en una sola orden, asi que las dos son del lote
 * (`loteSeleccionado.cantidad_programada` / `.valor_maquila_unidad`) y el
 * backend copia la cantidad al guardar. Pedirlas aqui tambien abria la
 * puerta a que las cifras se desincronizaran.
 *
 * `creado_por` no se pide: lo pone el backend con el usuario de la sesion.
 * `numero_orden` tampoco: lo genera el backend al crear (`OP-2026-0001`...).
 */
export const emptyOrdenForm = {
  id_lote: "",
  fecha_inicio_programada: "",
  fecha_fin_programada: "",
  eficiencia_esperada: "",
  estado: "PENDIENTE",
  observaciones: "",
};

const aNumero = (valor) =>
  valor === "" || valor === null || valor === undefined ? null : Number(valor);

function toFormValues(orderData) {
  if (!orderData) return {};

  return {
    ...orderData,
    id_lote: orderData.id_lote ?? "",
    fecha_inicio_programada: aFechaInput(orderData.fecha_inicio_programada),
    fecha_fin_programada: aFechaInput(orderData.fecha_fin_programada),
  };
}

export function useOrdenForm({ orderData } = {}) {
  const [form, setForm] = useState({ ...emptyOrdenForm, ...toFormValues(orderData) });
  const [guardando, setGuardando] = useState(false);
  const [errors, setErrors] = useState({});

  const lotes = useCatalogo(endpoints.lotes, {
    valor: "id_lote",
    etiqueta: (fila) =>
      fila.codigo_lote + (fila.nombre_cliente ? " - " + fila.nombre_cliente : ""),
  });
  // Los modulos ya no se escogen aqui --la orden nace libre-- pero su
  // capacidad sirve para proponer con cuanta gente estimar.
  const modulos = useCatalogo(endpoints.modulos, {
    valor: "id_modulo",
    etiqueta: (fila) => fila.codigo + " - " + fila.nombre,
  });

  const [personasSupuestas, setPersonasSupuestas] = useState("");

  /**
   * Cuanto dura un dia de planta. Sale de las franjas, no de un campo.
   *
   * Antes la estimacion usaba `modulos.horas_jornada`, una columna que
   * se escribia a mano y decia 9; la planta trabaja 520 minutos, que son
   * 8.67. Estimar los dias de una orden con una hora de mas por dia
   * comprometia fechas de entrega que no daban.
   */
  const [minutosDia, setMinutosDia] = useState(0);
  // Los mismos patrones, guardados completos (con `dias` y
  // `minutos_totales` de cada uno) para poder recorrer fechas reales en
  // `calcularFechaEstimada`, no solo sacar el numero mas largo del mes.
  const [patrones, setPatrones] = useState([]);
  // Festivos y cierres que se restan de ese recorrido (tabla
  // `dias_no_laborales`, administrada desde su propia pantalla).
  const [festivos, setFestivos] = useState([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const horario = await apiClient.get(endpoints.jornadaHorario);
        // Si el dia de hoy no se trabaja (domingo), se toma el patron
        // mas largo: la estimacion habla de dias laborales, no de hoy.
        const minutos =
          Number(horario?.del_dia?.minutos_totales) ||
          Math.max(0, ...(horario?.patrones ?? []).map((p) => Number(p.minutos_totales) || 0));
        if (activo) {
          setMinutosDia(minutos);
          setPatrones(horario?.patrones ?? []);
        }
      } catch {
        if (activo) {
          setMinutosDia(0);
          setPatrones([]);
        }
      }
    })();
    (async () => {
      try {
        const respuesta = await apiClient.get(endpoints.diasNoLaborales);
        if (activo) setFestivos((respuesta?.datos ?? []).map((fila) => aFechaInput(fila.fecha)));
      } catch {
        if (activo) setFestivos([]);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const setField = (campo, valor) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    setErrors((previo) => ({ ...previo, [campo]: "" }));
  };

  const reset = () => {
    setForm(emptyOrdenForm);
    setErrors({});
  };

  const loteSeleccionado = lotes.buscar(form.id_lote);

  /**
   * Cuantas operarias suponer. Arranca en la capacidad tipica de la
   * planta --la mediana de los modulos activos-- y la puede cambiar quien
   * programa. Antes salia del modulo asignado a la orden; ese campo ya no
   * existe porque la orden nace libre.
   */
  const capacidadTipica = useMemo(() => {
    const capacidades = (modulos.datos ?? [])
      .map((modulo) => Number(modulo.capacidad_operarios) || 0)
      .filter((valor) => valor > 0)
      .sort((a, b) => a - b);

    if (capacidades.length === 0) return 0;
    return capacidades[Math.floor(capacidades.length / 2)];
  }, [modulos.datos]);

  const personas = Number(personasSupuestas) || capacidadTipica;

  /**
   * Capacidad estimada con el SAM del lote y el tamano del modulo.
   *
   * Es la misma cuenta de la captura --(personas x minutos) / SAM-- pero
   * con los minutos del dia completo. Sin horario no hay estimacion: es
   * preferible no mostrarla a mostrarla con un numero inventado.
   */
  const estimacion = useMemo(() => {
    const sam = Number(loteSeleccionado?.sam_pactado || 0);
    const cantidad = Number(loteSeleccionado?.cantidad_programada || 0);

    if (sam <= 0 || personas <= 0 || cantidad <= 0 || minutosDia <= 0) return null;

    const porHora = (personas * 60) / sam;
    const porDia = (personas * minutosDia) / sam;

    return {
      sam,
      horasDia: Number((minutosDia / 60).toFixed(2)),
      unidadesPorHora: Number(porHora.toFixed(1)),
      unidadesPorDia: Math.round(porDia),
      diasEstimados: Math.ceil(cantidad / porDia),
    };
  }, [loteSeleccionado, personas, minutosDia]);

  /** "Del ... al ... (N dias)" mientras se programa la orden. */
  const diasProgramados = useMemo(
    () => diasEntre(form.fecha_inicio_programada, form.fecha_fin_programada),
    [form.fecha_inicio_programada, form.fecha_fin_programada],
  );

  /**
   * La fecha en que estaria lista la orden segun el supuesto de
   * eficiencia esperada, recorriendo dias de calendario reales (salta
   * domingos y festivos) en vez de dividir contra el mes mas largo.
   *
   * Es solo una sugerencia: "Fecha de fin programada" la sigue
   * escribiendo quien programa, esto no la llena solo.
   */
  const fechaEstimadaEntrega = useMemo(() => {
    const sam = Number(loteSeleccionado?.sam_pactado || 0);
    const cantidad = Number(loteSeleccionado?.cantidad_programada || 0);
    const eficiencia = Number(form.eficiencia_esperada || 0);

    return calcularFechaEstimada({
      fechaInicioISO: form.fecha_inicio_programada || hoyLocal(),
      cantidad,
      sam,
      personas,
      eficienciaEsperadaPct: eficiencia,
      patrones,
      festivos,
    });
  }, [loteSeleccionado, personas, form.eficiencia_esperada, form.fecha_inicio_programada, patrones, festivos]);

  /** Si la estimacion cae despues de lo que el lote le prometio al cliente. */
  const entregaLoteEnRiesgo = Boolean(
    fechaEstimadaEntrega &&
      loteSeleccionado?.fecha_entrega_programada &&
      fechaEstimadaEntrega > aFechaInput(loteSeleccionado.fecha_entrega_programada),
  );

  const buildPayload = () => ({
    ...form,
    id_lote: aNumero(form.id_lote),
    fecha_inicio_programada: form.fecha_inicio_programada || null,
    fecha_fin_programada: form.fecha_fin_programada || null,
    eficiencia_esperada: aNumero(form.eficiencia_esperada),
    observaciones: form.observaciones || null,
  });

  /** Reglas de `validations/ordenValidation.js`. */
  const validar = () => {
    const { errores } = validarOrden({
      form,
      catalogos: { loteOptions: lotes.options },
    });

    setErrors(errores);

    if (Object.keys(errores).length > 0) {
      toast.error("Revisa los campos marcados antes de guardar");
      return false;
    }
    return true;
  };

  /** Crea o actualiza la orden contra la API. No viaja nada sin validar. */
  const guardar = async (esEdicion) => {
    if (!validar()) return false;

    setGuardando(true);
    try {
      const payload = buildPayload();
      if (esEdicion && orderData?.id_orden_produccion) {
        await apiClient.put(`${endpoints.ordenes}/${orderData.id_orden_produccion}`, payload);
      } else {
        await apiClient.post(endpoints.ordenes, payload);
      }
      toast.success(esEdicion ? "Orden actualizada" : "Orden creada");
      return true;
    } catch (problema) {
      toast.error(problema.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    form,
    setField,
    errors,
    validar,
    reset,
    estimacion,
    diasProgramados,
    fechaEstimadaEntrega,
    entregaLoteEnRiesgo,
    guardando,
    guardar,
    buildPayload,
    loteSeleccionado,
    loteOptions: lotes.options,
    personasSupuestas: personas,
    setPersonasSupuestas,
  };
}
