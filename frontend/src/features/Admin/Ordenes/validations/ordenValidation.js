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
  eficienciaEsperada: { min: 1, max: 100 },
};

// Los tres que puede traer una orden. Ya no se escoge ninguno a mano:
// Pendiente es donde nace, En proceso lo pone `jornada.routes.js` cuando
// un modulo la toma, y Finalizado lo pone `captura.routes.js` al
// completarse la cantidad programada.
export const ordenEstados = ["PENDIENTE", "EN_PROCESO", "FINALIZADO"];

export function crearOrdenEsquema({ loteOptions = [] } = {}) {
  return {
    id_lote: [
      reglas.seleccionRequerida("El lote"),
      reglas.opcionValida(loteOptions, "El lote seleccionado"),
    ],
    // Supuesto de planeacion, no una eficiencia declarada de forma fija:
    // German lo ajusta a mano por pedido y puede dejarlo vacio.
    eficiencia_esperada: [
      reglas.numero({ ...ordenLimites.eficienciaEsperada, etiqueta: "La eficiencia esperada" }),
    ],
    observaciones: [
      reglas.longitud({ ...ordenLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
  };
}

/** Valida la orden. */
export function validarOrden({ form, catalogos }) {
  return { errores: validarFormulario(form, crearOrdenEsquema(catalogos)) };
}
