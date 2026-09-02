import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Reglas del formulario de orden de produccion.
 *
 * `form`    -> tabla `ordenes_produccion`
 * `detalle` -> tabla `detalle_orden_produccion` (una fila por prenda)
 *
 * La orden es lo que aterriza un lote en un modulo, asi que lote, modulo y
 * ficha son obligatorios: sin ficha no hay SAM y sin SAM no hay meta horaria.
 */
export const ordenLimites = {
  numero: { min: 3, max: 30 },
  cantidad: { min: 1, max: 999999 },
  valorMaquila: { min: 0, max: 9999999 },
  observaciones: { max: 255 },
};

export const ordenEstados = ["PENDIENTE", "EN_PROCESO", "PAUSADA", "FINALIZADA", "CANCELADA"];
export const ordenPrioridades = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

export function crearOrdenEsquema({
  loteOptions = [],
  moduloOptions = [],
  fichaOptions = [],
  pedidoOptions = [],
} = {}) {
  return {
    numero_orden: [
      reglas.requerido("El numero de orden"),
      reglas.longitud({ ...ordenLimites.numero, etiqueta: "El numero de orden" }),
      reglas.sinCaracteresEspeciales("El numero de orden"),
    ],
    id_pedido: [reglas.opcionValida(pedidoOptions, "El pedido seleccionado")],
    id_lote: [
      reglas.seleccionRequerida("El lote"),
      reglas.opcionValida(loteOptions, "El lote seleccionado"),
    ],
    id_modulo: [
      reglas.seleccionRequerida("El modulo"),
      reglas.opcionValida(moduloOptions, "El modulo seleccionado"),
    ],
    id_ficha_tecnica: [
      reglas.seleccionRequerida("La ficha tecnica"),
      reglas.opcionValida(fichaOptions, "La ficha tecnica seleccionada"),
    ],
    cantidad_programada: [
      reglas.requerido("La cantidad programada"),
      reglas.entero({ etiqueta: "La cantidad programada" }),
      reglas.numero({ ...ordenLimites.cantidad, etiqueta: "La cantidad programada" }),
    ],
    fecha_inicio_programada: [
      reglas.fecha({ etiqueta: "La fecha de inicio programada" }),
      reglas.anteriorA("fecha_fin_programada", "La fecha de inicio programada"),
    ],
    fecha_fin_programada: [
      reglas.fecha({ etiqueta: "La fecha de fin programada" }),
      reglas.posteriorA("fecha_inicio_programada", "La fecha de fin programada"),
    ],
    valor_maquila_unidad: [
      reglas.noNegativo({ etiqueta: "El valor de maquila" }),
      reglas.numero({ ...ordenLimites.valorMaquila, etiqueta: "El valor de maquila" }),
    ],
    prioridad: [
      reglas.seleccionRequerida("La prioridad"),
      reglas.opcionValida(ordenPrioridades, "La prioridad"),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(ordenEstados, "El estado")],
    observaciones: [
      reglas.longitud({ ...ordenLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
  };
}

/**
 * Reglas del detalle por prenda.
 *
 * No se exige detalle: una orden puede crearse y repartirse despues. Pero si
 * hay lineas, cada una necesita prenda y cantidad, y la suma no puede pasarse
 * de la cantidad programada de la orden.
 */
export function validarDetalle(detalle = [], cantidadProgramada = 0) {
  const lineas = detalle.filter((linea) => linea.id_prenda || linea.cantidad_programada);
  if (lineas.length === 0) return "";

  const sinPrenda = lineas.some((linea) => !linea.id_prenda);
  if (sinPrenda) return "Hay lineas de detalle sin prenda seleccionada";

  const sinCantidad = lineas.some((linea) => Number(linea.cantidad_programada || 0) <= 0);
  if (sinCantidad) return "Cada prenda del detalle necesita una cantidad mayor que cero";

  const total = lineas.reduce((suma, linea) => suma + Number(linea.cantidad_programada || 0), 0);
  const programada = Number(cantidadProgramada || 0);

  if (programada > 0 && total > programada) {
    return `El detalle suma ${total} unidades y la orden programa ${programada}`;
  }

  return "";
}

/** Valida la orden completa: cabecera y detalle en una sola pasada. */
export function validarOrden({ form, detalle, catalogos }) {
  const errores = validarFormulario(form, crearOrdenEsquema(catalogos));
  const errorDetalle = validarDetalle(detalle, form?.cantidad_programada);

  return { errores, errorDetalle };
}
