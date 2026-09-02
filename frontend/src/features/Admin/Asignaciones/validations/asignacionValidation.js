import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de asignacion -> tabla `asignaciones_modulo`.
 * Define quien trabaja en que modulo y con que rol; la fecha de fin es
 * opcional (asignacion abierta) pero nunca anterior al inicio.
 */
export const asignacionLimites = {
  observaciones: { max: 255 },
};

export const asignacionEstados = ["PROGRAMADA", "ACTIVA", "FINALIZADA", "CANCELADA"];
export const asignacionTurnos = ["MANANA", "TARDE", "NOCHE", "MIXTO"];
export const asignacionRoles = ["OPERARIO", "SUPERVISOR", "MECANICO"];

export function crearAsignacionEsquema({ moduloOptions = [], operarioOptions = [] } = {}) {
  return {
    id_modulo: [
      reglas.seleccionRequerida("El modulo"),
      reglas.opcionValida(moduloOptions, "El modulo seleccionado"),
    ],
    id_operario: [
      reglas.seleccionRequerida("El operario"),
      reglas.opcionValida(operarioOptions, "El operario seleccionado"),
    ],
    rol_asignacion: [
      reglas.seleccionRequerida("El rol en el modulo"),
      reglas.opcionValida(asignacionRoles, "El rol en el modulo"),
    ],
    turno: [
      reglas.seleccionRequerida("El turno"),
      reglas.opcionValida(asignacionTurnos, "El turno"),
    ],
    fecha_inicio: [
      reglas.requerido("La fecha de inicio"),
      reglas.fecha({ etiqueta: "La fecha de inicio" }),
      reglas.anteriorA("fecha_fin", "La fecha de inicio"),
    ],
    fecha_fin: [
      reglas.fecha({ etiqueta: "La fecha de fin" }),
      reglas.posteriorA("fecha_inicio", "La fecha de fin"),
    ],
    observaciones: [
      reglas.longitud({ ...asignacionLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(asignacionEstados, "El estado"),
    ],
  };
}
