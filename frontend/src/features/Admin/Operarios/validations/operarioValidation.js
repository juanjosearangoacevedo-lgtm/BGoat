import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de operario -> tabla `operarios`.
 * Es el personal de planta: operarias y mecanicos. El codigo (OP-001...) no
 * se valida porque no se digita: lo asigna el sistema.
 */
export const operarioLimites = {
  nombres: { min: 2, max: 60 },
  apellidos: { min: 2, max: 60 },
  telefono: { min: 7, max: 15 },
};

export const operarioTiposDocumento = ["CC", "CE", "TI", "PASAPORTE", "OTRO"];
export const operarioCargos = ["OPERARIO", "MECANICO", "OTRO"];
export const operarioEstados = ["ACTIVO", "INACTIVO", "RETIRADO"];

export function crearOperarioEsquema({ lista = [], editing = null } = {}) {
  return {
    cargo: [reglas.seleccionRequerida("El cargo"), reglas.opcionValida(operarioCargos, "El cargo")],
    tipo_documento: [
      reglas.seleccionRequerida("El tipo de documento"),
      reglas.opcionValida(operarioTiposDocumento, "El tipo de documento"),
    ],
    numero_documento: [
      reglas.requerido("El número de documento"),
      // Segun el tipo: cédula solo números, pasaporte letras y números... (ver documentRules.js)
      reglas.documento({ actual: editing }),
      reglas.unico({
        lista,
        campo: "numero_documento",
        idField: "id_operario",
        actual: editing,
        etiqueta: "Ese documento",
      }),
    ],
    nombres: [
      reglas.requerido("Los nombres"),
      reglas.longitud({ ...operarioLimites.nombres, etiqueta: "Los nombres" }),
      reglas.soloLetras("Los nombres"),
    ],
    apellidos: [
      reglas.requerido("Los apellidos"),
      reglas.longitud({ ...operarioLimites.apellidos, etiqueta: "Los apellidos" }),
      reglas.soloLetras("Los apellidos"),
    ],
    telefono: [reglas.telefono({ ...operarioLimites.telefono })],
    correo: [reglas.correo()],
    fecha_ingreso: [
      reglas.requerido("La fecha de ingreso"),
      reglas.fecha({ etiqueta: "La fecha de ingreso" }),
      reglas.noFutura({ etiqueta: "La fecha de ingreso" }),
    ],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(operarioEstados, "El estado"),
    ],
  };
}
