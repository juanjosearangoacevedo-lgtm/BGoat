import { reglas } from "@/shared/validations";

/** Reglas del calendario de festivos -> tabla `dias_no_laborales`. */
export const diaNoLaboralLimites = {
  descripcion: { max: 100 },
};

export function crearDiaNoLaboralEsquema({ lista = [], editing = null } = {}) {
  return {
    fecha: [
      reglas.requerido("La fecha"),
      reglas.unico({
        lista,
        campo: "fecha",
        idField: "fecha",
        actual: editing,
        etiqueta: "Esa fecha",
      }),
    ],
    descripcion: [
      reglas.longitud({ ...diaNoLaboralLimites.descripcion, etiqueta: "La descripción" }),
    ],
  };
}
