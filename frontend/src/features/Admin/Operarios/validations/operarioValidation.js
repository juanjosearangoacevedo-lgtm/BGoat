import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de operario -> tabla `operarios`.
 * Es el personal de planta: operarias, supervisoras y mecanicos.
 */
export const operarioLimites = {
  codigo: { min: 2, max: 20 },
  nombres: { min: 2, max: 60 },
  apellidos: { min: 2, max: 60 },
  documento: { min: 5, max: 20 },
  telefono: { min: 7, max: 15 },
  especialidad: { max: 60 },
};

export const operarioTiposDocumento = ["CC", "CE", "TI", "PASAPORTE", "OTRO"];
export const operarioCargos = ["OPERARIO", "SUPERVISOR", "MECANICO", "OTRO"];
export const operarioEstados = ["ACTIVO", "INACTIVO", "RETIRADO"];

/** El pasaporte admite letras; los demas documentos del pais no. */
const documentoSegunTipo = (valor, form) =>
  form?.tipo_documento === "PASAPORTE"
    ? reglas.longitud({ ...operarioLimites.documento, etiqueta: "El documento" })(valor, form)
    : reglas.soloDigitos("El numero de documento")(valor, form);

export function crearOperarioEsquema({ lista = [], editing = null } = {}) {
  return {
    codigo_operario: [
      reglas.requerido("El codigo"),
      reglas.longitud({ ...operarioLimites.codigo, etiqueta: "El codigo" }),
      reglas.sinCaracteresEspeciales("El codigo"),
      reglas.unico({
        lista,
        campo: "codigo_operario",
        idField: "id_operario",
        actual: editing,
        etiqueta: "Ese codigo de operario",
      }),
    ],
    cargo: [reglas.seleccionRequerida("El cargo"), reglas.opcionValida(operarioCargos, "El cargo")],
    tipo_documento: [
      reglas.seleccionRequerida("El tipo de documento"),
      reglas.opcionValida(operarioTiposDocumento, "El tipo de documento"),
    ],
    numero_documento: [
      reglas.requerido("El numero de documento"),
      documentoSegunTipo,
      reglas.longitud({ ...operarioLimites.documento, etiqueta: "El numero de documento" }),
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
    especialidad: [reglas.longitud({ ...operarioLimites.especialidad, etiqueta: "La especialidad" })],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(operarioEstados, "El estado"),
    ],
  };
}
