import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de modulo -> tabla `modulos`.
 *
 * Solo quedan los dos parametros que el negocio decide: cuantos puestos
 * tiene el modulo y bajo que % se pide la incidencia. Las horas del dia
 * y la eficiencia salen de lo capturado, asi que no se validan aqui
 * porque ya no se escriben. Tampoco el codigo (lo asigna el sistema), ni la
 * ubicacion ni el orden en el tablero (ya no se piden).
 */
export const moduloLimites = {
  nombre: { min: 2, max: 60 },
  capacidad: { min: 0, max: 200 },
  umbral: { min: 1, max: 100 },
  observaciones: { max: 255 },
};

export const moduloEstados = ["ACTIVO", "INACTIVO", "MANTENIMIENTO"];

const enteroEnRango = (rango, etiqueta) => [
  reglas.entero({ etiqueta }),
  reglas.numero({ ...rango, etiqueta }),
];

export function crearModuloEsquema() {
  return {
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...moduloLimites.nombre, etiqueta: "El nombre" }),
    ],
    capacidad_operarios: enteroEnRango(moduloLimites.capacidad, "La capacidad de operarios"),
    umbral_cumplimiento: [
      reglas.numero({ ...moduloLimites.umbral, etiqueta: "El umbral de cumplimiento" }),
    ],
    observaciones: [
      reglas.longitud({ ...moduloLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(moduloEstados, "El estado")],
  };
}
