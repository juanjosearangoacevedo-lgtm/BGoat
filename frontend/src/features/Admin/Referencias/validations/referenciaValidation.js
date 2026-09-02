import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de referencia -> tabla `referencias`.
 * La referencia es el estilo que la marca manda a confeccionar; sobre ella
 * cuelga la ficha tecnica con el SAM.
 */
export const referenciaLimites = {
  codigo: { min: 2, max: 30 },
  nombre: { min: 3, max: 100 },
  descripcion: { max: 255 },
};

export const referenciaEstados = ["ACTIVO", "INACTIVO"];

export function crearReferenciaEsquema({ lista = [], editing = null, marcaOptions = [] } = {}) {
  return {
    id_marca: [
      reglas.seleccionRequerida("La marca"),
      reglas.opcionValida(marcaOptions, "La marca seleccionada"),
    ],
    codigo: [
      reglas.requerido("El codigo"),
      reglas.longitud({ ...referenciaLimites.codigo, etiqueta: "El codigo" }),
      reglas.sinCaracteresEspeciales("El codigo"),
      reglas.unico({
        lista,
        campo: "codigo",
        idField: "id_referencia",
        actual: editing,
        etiqueta: "Ese codigo de referencia",
      }),
    ],
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...referenciaLimites.nombre, etiqueta: "El nombre" }),
    ],
    descripcion: [
      reglas.longitud({ ...referenciaLimites.descripcion, etiqueta: "La descripcion" }),
    ],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(referenciaEstados, "El estado"),
    ],
  };
}
