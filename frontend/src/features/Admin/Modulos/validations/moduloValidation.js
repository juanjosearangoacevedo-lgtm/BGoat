import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de modulo -> tabla `modulos`.
 * Las horas de jornada definen el alto de la rejilla de captura y el umbral
 * decide cuando la app pide la causa, asi que ambos tienen rangos estrictos.
 */
export const moduloLimites = {
  codigo: { min: 2, max: 20 },
  nombre: { min: 2, max: 60 },
  ubicacion: { max: 60 },
  capacidad: { min: 0, max: 200 },
  horasJornada: { min: 1, max: 24 },
  horasSemanales: { min: 1, max: 168 },
  eficiencia: { min: 1, max: 200 },
  umbral: { min: 1, max: 100 },
  ordenVisual: { min: 1, max: 99 },
  observaciones: { max: 255 },
};

export const moduloEstados = ["ACTIVO", "INACTIVO", "MANTENIMIENTO"];

const enteroEnRango = (rango, etiqueta) => [
  reglas.entero({ etiqueta }),
  reglas.numero({ ...rango, etiqueta }),
];

export function crearModuloEsquema({ lista = [], editing = null } = {}) {
  return {
    codigo: [
      reglas.requerido("El codigo"),
      reglas.longitud({ ...moduloLimites.codigo, etiqueta: "El codigo" }),
      reglas.sinCaracteresEspeciales("El codigo"),
      reglas.unico({
        lista,
        campo: "codigo",
        idField: "id_modulo",
        actual: editing,
        etiqueta: "Ese codigo de modulo",
      }),
    ],
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...moduloLimites.nombre, etiqueta: "El nombre" }),
    ],
    ubicacion: [reglas.longitud({ ...moduloLimites.ubicacion, etiqueta: "La ubicacion" })],
    capacidad_operarios: enteroEnRango(moduloLimites.capacidad, "La capacidad de operarios"),
    horas_jornada: enteroEnRango(moduloLimites.horasJornada, "Las horas de jornada"),
    horas_semanales: enteroEnRango(moduloLimites.horasSemanales, "Las horas semanales"),
    eficiencia_esperada: [
      reglas.numero({ ...moduloLimites.eficiencia, etiqueta: "La eficiencia esperada" }),
    ],
    umbral_cumplimiento: [
      reglas.numero({ ...moduloLimites.umbral, etiqueta: "El umbral de cumplimiento" }),
    ],
    orden_visual: enteroEnRango(moduloLimites.ordenVisual, "El orden en el tablero"),
    observaciones: [
      reglas.longitud({ ...moduloLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(moduloEstados, "El estado")],
  };
}
