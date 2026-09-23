import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";
import { hoyLocal } from "@/shared/utils/formatters";
import { PASOS, validarPaso } from "../validations/jornadaValidation";

const formularioVacio = {
  id_modulo: "",
  cantidad_operarias: 1,
  id_cliente: "",
  id_lote: "",
  id_orden_produccion: "",
  observaciones: "",
};

/**
 * Inicio de jornada -> tablas `jornada_modulo` y `jornada_operaria`.
 *
 * Es lo primero que hace la digitadora al entrar. Cuatro preguntas, una
 * por pantalla: modulo, cuantas operarias, quienes, y que se produce.
 *
 * Todo el catalogo que el asistente necesita llega en UNA sola peticion
 * (`/jornada/opciones`): son cuatro listas pequenas y ella configura de
 * pie, con el celular. Cuatro peticiones en serie son cuatro momentos en
 * que la pantalla se queda pensando.
 */
export function useJornadaPage({ moduloInicial = null, fechaInicial = null } = {}) {
  // Se llega aqui desde la captura, que puede estar mirando un dia pasado:
  // abrir siempre en hoy obligaria a volver a escoger la fecha.
  const [fecha, setFecha] = useState(() => fechaInicial || hoyLocal());
  const [opciones, setOpciones] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState(() => ({
    ...formularioVacio,
    id_modulo: moduloInicial ? String(moduloInicial) : "",
  }));
  const [errors, setErrors] = useState({});

  // La nomina es posicional: `asignacion[0]` es la operaria 1.
  // `null` en una posicion significa anonima, que es un dato valido.
  const [asignacion, setAsignacion] = useState([null]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setOpciones(await apiClient.get(withQuery(endpoints.jornadaOpciones, { fecha })));
    } catch (problema) {
      setError(problema.message);
      setOpciones(null);
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const modulos = opciones?.modulos ?? [];
  const clientes = opciones?.clientes ?? [];
  const operarias = opciones?.operarias ?? [];

  const moduloSeleccionado = useMemo(
    () => modulos.find((m) => String(m.id_modulo) === String(form.id_modulo)) ?? null,
    [modulos, form.id_modulo],
  );

  /**
   * Lotes del cliente elegido. El backend manda todos y aqui se filtran:
   * la lista completa son unas pocas decenas de filas y volver a pedirla
   * cada vez que ella cambia de cliente agrega una espera en mitad del
   * asistente.
   */
  const lotesDelCliente = useMemo(() => {
    if (!form.id_cliente) return [];
    return (opciones?.lotes ?? []).filter(
      (lote) => String(lote.id_cliente) === String(form.id_cliente),
    );
  }, [opciones, form.id_cliente]);

  const loteSeleccionado = useMemo(
    () => lotesDelCliente.find((l) => String(l.id_lote) === String(form.id_lote)) ?? null,
    [lotesDelCliente, form.id_lote],
  );

  /**
   * Las ordenes de ese lote que ESTE modulo puede tomar.
   *
   * La orden nace libre y la toma el modulo que abre la jornada con ella.
   * Las que ya tomo otro modulo no se ofrecen; la que tomo este modulo si,
   * para que reabrir la jornada no la deje sin orden.
   */
  const ordenesDelLote = useMemo(() => {
    if (!form.id_lote) return [];
    return (opciones?.ordenes ?? []).filter(
      (orden) =>
        String(orden.id_lote) === String(form.id_lote) &&
        (orden.tomada_por == null || String(orden.tomada_por) === String(form.id_modulo)),
    );
  }, [opciones, form.id_lote, form.id_modulo]);

  const ordenSeleccionada = useMemo(
    () =>
      ordenesDelLote.find(
        (orden) => String(orden.id_orden_produccion) === String(form.id_orden_produccion),
      ) ?? null,
    [ordenesDelLote, form.id_orden_produccion],
  );

  /**
   * Con una sola orden disponible no se pregunta: se toma. Preguntar
   * "cual de estas una" es un paso que no decide nada.
   */
  useEffect(() => {
    if (ordenesDelLote.length === 1) {
      const unica = String(ordenesDelLote[0].id_orden_produccion);
      setForm((previo) =>
        previo.id_orden_produccion === unica ? previo : { ...previo, id_orden_produccion: unica },
      );
    } else if (
      form.id_orden_produccion &&
      !ordenesDelLote.some(
        (orden) => String(orden.id_orden_produccion) === String(form.id_orden_produccion),
      )
    ) {
      setForm((previo) => ({ ...previo, id_orden_produccion: "" }));
    }
  }, [ordenesDelLote, form.id_orden_produccion]);

  /** Jornadas ya abiertas hoy: la pantalla las ofrece para continuar. */
  const jornadasAbiertas = useMemo(
    () => modulos.filter((modulo) => modulo.id_jornada_modulo),
    [modulos],
  );

  const setField = useCallback((campo, valor) => {
    setForm((previo) => {
      const siguiente = { ...previo, [campo]: valor };
      // Cambiar de cliente invalida el lote: los lotes son de un cliente
      // y dejar el anterior seleccionado produce una jornada cruzada.
      if (campo === "id_cliente") {
        siguiente.id_lote = "";
        siguiente.id_orden_produccion = "";
      }
      // Y cambiar de lote invalida la orden, que es de un lote.
      if (campo === "id_lote") siguiente.id_orden_produccion = "";
      return siguiente;
    });
    setErrors((previo) => ({ ...previo, [campo]: "" }));
  }, []);

  /** Ajusta la nomina al numero declarado, conservando lo ya asignado. */
  const setCantidad = useCallback((valor) => {
    const cantidad = Math.min(Math.max(Number(valor) || 0, 1), 99);
    setForm((previo) => ({ ...previo, cantidad_operarias: cantidad }));
    setErrors((previo) => ({ ...previo, cantidad_operarias: "" }));
    setAsignacion((previo) => {
      const siguiente = previo.slice(0, cantidad);
      while (siguiente.length < cantidad) siguiente.push(null);
      return siguiente;
    });
  }, []);

  /** Asigna (o desasigna, con null) la operaria de un puesto. */
  const asignarOperaria = useCallback((indice, idOperario) => {
    setAsignacion((previo) => {
      const siguiente = [...previo];
      const valor = idOperario ? Number(idOperario) : null;

      // Una misma operaria no puede ocupar dos puestos: si ya estaba en
      // otro, se mueve en vez de duplicarse. Es lo que la digitadora
      // espera al corregir un toque equivocado.
      if (valor !== null) {
        const anterior = siguiente.indexOf(valor);
        if (anterior !== -1 && anterior !== indice) siguiente[anterior] = null;
      }

      siguiente[indice] = valor;
      return siguiente;
    });
  }, []);

  const contextoValidacion = useMemo(
    () => ({
      moduloOptions: modulos.map((m) => ({ value: String(m.id_modulo), label: m.codigo })),
      loteOptions: lotesDelCliente.map((l) => ({ value: String(l.id_lote), label: l.codigo_lote })),
    }),
    [modulos, lotesDelCliente],
  );

  const pasoActual = PASOS[paso];

  const avanzar = useCallback(() => {
    const encontrados = validarPaso(pasoActual.clave, form, contextoValidacion);
    setErrors(encontrados);

    if (Object.keys(encontrados).length > 0) {
      toast.error(Object.values(encontrados)[0]);
      return false;
    }

    setPaso((previo) => Math.min(previo + 1, PASOS.length - 1));
    return true;
  }, [pasoActual, form, contextoValidacion]);

  const retroceder = useCallback(() => setPaso((previo) => Math.max(previo - 1, 0)), []);

  const reiniciar = useCallback(() => {
    setForm(formularioVacio);
    setAsignacion([null]);
    setErrors({});
    setPaso(0);
  }, []);

  /** Abre la jornada. Devuelve la jornada creada, o null si fallo. */
  const iniciar = useCallback(async () => {
    const encontrados = validarPaso("trabajo", form, contextoValidacion);
    setErrors(encontrados);
    if (Object.keys(encontrados).length > 0) {
      toast.error(Object.values(encontrados)[0]);
      return null;
    }

    setGuardando(true);
    try {
      const creada = await apiClient.post(endpoints.jornada, {
        id_modulo: Number(form.id_modulo),
        id_lote: Number(form.id_lote),
        id_orden_produccion: form.id_orden_produccion
          ? Number(form.id_orden_produccion)
          : null,
        fecha,
        cantidad_operarias: Number(form.cantidad_operarias),
        operarias: asignacion,
        observaciones: form.observaciones || null,
      });

      toast.success(`Jornada iniciada en ${creada.codigo_modulo}`);
      await cargar();
      reiniciar();
      return creada;
    } catch (problema) {
      toast.error(problema.message);
      return null;
    } finally {
      setGuardando(false);
    }
  }, [form, asignacion, fecha, contextoValidacion, cargar, reiniciar]);

  const cerrar = useCallback(
    async (idJornada) => {
      try {
        await apiClient.post(buildPath(endpoints.cerrarJornada, { id: idJornada }), {});
        toast.success("Jornada cerrada");
        await cargar();
        return true;
      } catch (problema) {
        toast.error(problema.message);
        return false;
      }
    },
    [cargar],
  );

  const reabrir = useCallback(
    async (idJornada) => {
      try {
        await apiClient.post(buildPath(endpoints.reabrirJornada, { id: idJornada }), {});
        toast.success("Jornada reabierta");
        await cargar();
        return true;
      } catch (problema) {
        toast.error(problema.message);
        return false;
      }
    },
    [cargar],
  );

  return {
    fecha,
    setFecha,
    esHoy: fecha === hoyLocal(),
    cargando,
    error,
    guardando,

    modulos,
    clientes,
    operarias,
    lotesDelCliente,
    jornadasAbiertas,
    moduloSeleccionado,
    loteSeleccionado,
    ordenesDelLote,
    ordenSeleccionada,

    paso,
    pasoActual,
    pasos: PASOS,
    esUltimoPaso: paso === PASOS.length - 1,
    avanzar,
    retroceder,
    irAPaso: setPaso,
    reiniciar,

    form,
    errors,
    setField,
    setCantidad,
    asignacion,
    asignarOperaria,

    iniciar,
    cerrar,
    reabrir,
    recargar: cargar,
  };
}
