import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
import { aFechaInput } from "@/shared/utils/formatters";
import { validarOrden } from "../validations/ordenValidation";

/**
 * Formulario de orden de produccion.
 *
 * `form`    -> tabla `ordenes_produccion`
 * `detalle` -> tabla `detalle_orden_produccion` (una fila por prenda)
 *
 * `creado_por` no se pide: lo pone el backend con el usuario de la sesion.
 */
export const emptyOrdenForm = {
  numero_orden: "",
  id_pedido: "",
  id_lote: "",
  id_modulo: "",
  id_ficha_tecnica: "",
  fecha_inicio_programada: "",
  fecha_fin_programada: "",
  cantidad_programada: "",
  valor_maquila_unidad: "",
  prioridad: "MEDIA",
  estado: "PENDIENTE",
  observaciones: "",
};

export const emptyDetalleLinea = {
  id_prenda: "",
  cantidad_programada: "",
  observaciones: "",
};

const aNumero = (valor) =>
  valor === "" || valor === null || valor === undefined ? null : Number(valor);

function toFormValues(orderData) {
  if (!orderData) return {};

  return {
    ...orderData,
    id_pedido: orderData.id_pedido ?? "",
    id_lote: orderData.id_lote ?? "",
    id_modulo: orderData.id_modulo ?? "",
    id_ficha_tecnica: orderData.id_ficha_tecnica ?? "",
    fecha_inicio_programada: aFechaInput(orderData.fecha_inicio_programada),
    fecha_fin_programada: aFechaInput(orderData.fecha_fin_programada),
  };
}

export function useOrdenForm({ orderData } = {}) {
  const [form, setForm] = useState({ ...emptyOrdenForm, ...toFormValues(orderData) });
  const [detalle, setDetalle] = useState(orderData?.detalle ?? []);
  const [guardando, setGuardando] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorDetalle, setErrorDetalle] = useState("");

  const lotes = useCatalogo(endpoints.lotes, {
    valor: "id_lote",
    etiqueta: (fila) => fila.codigo_lote + (fila.nombre_marca ? " - " + fila.nombre_marca : ""),
  });
  const modulos = useCatalogo(endpoints.modulos, {
    valor: "id_modulo",
    etiqueta: (fila) => fila.codigo + " - " + fila.nombre,
  });
  const fichas = useCatalogo(endpoints.fichasTecnicas, {
    valor: "id_ficha_tecnica",
    etiqueta: (fila) =>
      fila.codigo_ficha + " v" + fila.version + " - SAM " + (fila.sam_pactado ?? "?") + " min",
  });
  const pedidos = useCatalogo(endpoints.pedidos, {
    valor: "id_pedido",
    etiqueta: (fila) => fila.numero_pedido + (fila.nombre_cliente ? " - " + fila.nombre_cliente : ""),
  });
  const prendas = useCatalogo(endpoints.prendas, {
    valor: "id_prenda",
    etiqueta: (fila) => fila.sku + " - " + fila.nombre,
  });

  const setField = (campo, valor) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    setErrors((previo) => ({ ...previo, [campo]: "" }));
  };

  const reset = () => {
    setForm(emptyOrdenForm);
    setDetalle([]);
    setErrors({});
    setErrorDetalle("");
  };

  // --- detalle_orden_produccion ----------------------------------------
  const addLinea = () => setDetalle((previo) => [...previo, { ...emptyDetalleLinea }]);

  const updateLinea = (indice, campo, valor) =>
    setDetalle((previo) =>
      previo.map((linea, i) => (i === indice ? { ...linea, [campo]: valor } : linea)),
    );

  const removeLinea = (indice) => setDetalle((previo) => previo.filter((_, i) => i !== indice));

  const totalDetalle = useMemo(
    () => detalle.reduce((total, linea) => total + Number(linea.cantidad_programada || 0), 0),
    [detalle],
  );

  /** SAM de la ficha elegida, para mostrar la capacidad estimada. */
  const fichaSeleccionada = fichas.buscar(form.id_ficha_tecnica);
  const moduloSeleccionado = modulos.buscar(form.id_modulo);

  const estimacion = useMemo(() => {
    const sam = Number(fichaSeleccionada?.sam_pactado || 0);
    const personas = Number(moduloSeleccionado?.capacidad_operarios || 0);
    const horas = Number(moduloSeleccionado?.horas_jornada || 9);
    const cantidad = Number(form.cantidad_programada || 0);

    if (sam <= 0 || personas <= 0 || cantidad <= 0) return null;

    const porHora = (personas * 60) / sam;
    const porDia = porHora * horas;

    return {
      sam,
      unidadesPorHora: Number(porHora.toFixed(1)),
      unidadesPorDia: Math.round(porDia),
      diasEstimados: Math.ceil(cantidad / porDia),
    };
  }, [fichaSeleccionada, moduloSeleccionado, form.cantidad_programada]);

  const buildPayload = () => ({
    ...form,
    id_pedido: aNumero(form.id_pedido),
    id_lote: aNumero(form.id_lote),
    id_modulo: aNumero(form.id_modulo),
    id_ficha_tecnica: aNumero(form.id_ficha_tecnica),
    cantidad_programada: Number(form.cantidad_programada || 0),
    valor_maquila_unidad: aNumero(form.valor_maquila_unidad),
    fecha_inicio_programada: form.fecha_inicio_programada || null,
    fecha_fin_programada: form.fecha_fin_programada || null,
    observaciones: form.observaciones || null,
    detalle: detalle
      .filter((linea) => linea.id_prenda)
      .map((linea) => ({
        id_prenda: Number(linea.id_prenda),
        cantidad_programada: Number(linea.cantidad_programada || 0),
        observaciones: linea.observaciones || null,
      })),
  });

  /** Reglas de `validations/ordenValidation.js`: cabecera y detalle. */
  const validar = () => {
    const { errores, errorDetalle: problemaDetalle } = validarOrden({
      form,
      detalle,
      catalogos: {
        loteOptions: lotes.options,
        moduloOptions: modulos.options,
        fichaOptions: fichas.options,
        pedidoOptions: pedidos.options,
      },
    });

    setErrors(errores);
    setErrorDetalle(problemaDetalle);

    if (Object.keys(errores).length > 0 || problemaDetalle) {
      toast.error(problemaDetalle || "Revisa los campos marcados antes de guardar");
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
    errorDetalle,
    validar,
    reset,
    detalle,
    addLinea,
    updateLinea,
    removeLinea,
    totalDetalle,
    estimacion,
    guardando,
    guardar,
    buildPayload,
    loteOptions: lotes.options,
    moduloOptions: modulos.options,
    fichaOptions: fichas.options,
    pedidoOptions: pedidos.options,
    prendaOptions: prendas.options,
  };
}
