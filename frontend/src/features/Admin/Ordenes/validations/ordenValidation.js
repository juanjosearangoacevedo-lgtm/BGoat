import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Reglas del formulario de orden de produccion -> tabla `ordenes_produccion`.
 *
 * La orden es lo que programa un lote: para cuando, con que prioridad.
 * Cuanto hay que sacar y a que valor de maquila ya estan en el lote (SAM
 * y valor de maquila viven ahi, con la ficha tecnica), asi que la orden
 * no los vuelve a pedir.
 *
 * Tampoco lleva ficha tecnica ni pedido: la ficha vive dentro del lote y
 * el pedido dejo de existir. Tampoco lleva detalle por prenda, porque la
 * produccion se mide por lote y no por talla y color, que es como se
 * mide en planta.
 */
export const ordenLimites = {
  observaciones: { max: 255 },
};

export const ordenEstados = ["PENDIENTE", "EN_PROCESO", "PAUSADA", "FINALIZADA", "CANCELADA"];
export const ordenPrioridades = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

export function crearOrdenEsquema({ loteOptions = [] } = {}) {
  return {
    id_lote: [
      reglas.seleccionRequerida("El lote"),
      reglas.opcionValida(loteOptions, "El lote seleccionado"),
    ],
    fecha_inicio_programada: [
      reglas.fecha({ etiqueta: "La fecha de inicio programada" }),
      reglas.anteriorA("fecha_fin_programada", "La fecha de inicio programada"),
    ],
    fecha_fin_programada: [
      reglas.fecha({ etiqueta: "La fecha de fin programada" }),
      reglas.posteriorA("fecha_inicio_programada", "La fecha de fin programada"),
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
