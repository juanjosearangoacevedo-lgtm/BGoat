import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Reglas del formulario de orden de produccion -> tabla `ordenes_produccion`.
 *
 * La orden es lo que aterriza un lote en un modulo: cuanto hay que sacar,
 * para cuando y a que valor de maquila.
 *
 * Ya no lleva ficha tecnica ni pedido: la ficha vive dentro del lote (con
 * su SAM y su imagen) y el pedido dejo de existir. Tampoco lleva detalle
 * por prenda, porque la produccion se mide por lote y no por talla y
 * color, que es como se mide en planta.
 */
export const ordenLimites = {
  numero: { min: 3, max: 30 },
  cantidad: { min: 1, max: 999999 },
  valorMaquila: { min: 0, max: 9999999 },
  observaciones: { max: 255 },
};

export const ordenEstados = ["PENDIENTE", "EN_PROCESO", "PAUSADA", "FINALIZADA", "CANCELADA"];
export const ordenPrioridades = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

export function crearOrdenEsquema({ loteOptions = [] } = {}) {
  return {
    numero_orden: [
      reglas.requerido("El numero de orden"),
      reglas.longitud({ ...ordenLimites.numero, etiqueta: "El numero de orden" }),
      reglas.sinCaracteresEspeciales("El numero de orden"),
    ],
    id_lote: [
      reglas.seleccionRequerida("El lote"),
      reglas.opcionValida(loteOptions, "El lote seleccionado"),
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

/** Valida la orden. */
export function validarOrden({ form, catalogos }) {
  return { errores: validarFormulario(form, crearOrdenEsquema(catalogos)) };
}
