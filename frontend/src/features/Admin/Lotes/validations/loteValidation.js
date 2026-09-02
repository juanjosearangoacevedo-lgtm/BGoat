import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de lote -> tabla `lotes`.
 * El lote llega del cliente: la recepcion es un hecho ya ocurrido, y las
 * fechas de inicio y finalizacion van despues de ella.
 */
export const loteLimites = {
  codigo: { min: 3, max: 30 },
  cantidad: { min: 0, max: 999999 },
  observaciones: { max: 255 },
};

export const loteEstados = ["REGISTRADO", "EN_PROCESO", "FINALIZADO", "CANCELADO", "INACTIVO"];

export function crearLoteEsquema({ lista = [], editing = null, marcaOptions = [] } = {}) {
  return {
    codigo_lote: [
      reglas.requerido("El codigo del lote"),
      reglas.longitud({ ...loteLimites.codigo, etiqueta: "El codigo del lote" }),
      reglas.sinCaracteresEspeciales("El codigo del lote"),
      reglas.unico({
        lista,
        campo: "codigo_lote",
        idField: "id_lote",
        actual: editing,
        etiqueta: "Ese codigo de lote",
      }),
    ],
    id_marca: [
      reglas.seleccionRequerida("La marca"),
      reglas.opcionValida(marcaOptions, "La marca seleccionada"),
    ],
    fecha_recepcion: [
      reglas.requerido("La fecha de recepcion"),
      reglas.fecha({ etiqueta: "La fecha de recepcion" }),
      reglas.noFutura({ etiqueta: "La fecha de recepcion" }),
    ],
    fecha_inicio: [
      reglas.fecha({ etiqueta: "La fecha de inicio" }),
      reglas.posteriorA("fecha_recepcion", "La fecha de inicio", "la fecha de recepcion"),
    ],
    fecha_finalizacion: [
      reglas.fecha({ etiqueta: "La fecha de finalizacion" }),
      reglas.posteriorA("fecha_inicio", "La fecha de finalizacion"),
    ],
    cantidad_programada: [
      reglas.entero({ etiqueta: "La cantidad programada" }),
      reglas.numero({ ...loteLimites.cantidad, etiqueta: "La cantidad programada" }),
    ],
    cantidad_recibida: [
      reglas.entero({ etiqueta: "La cantidad recibida" }),
      reglas.numero({ ...loteLimites.cantidad, etiqueta: "La cantidad recibida" }),
    ],
    observaciones: [reglas.longitud({ ...loteLimites.observaciones, etiqueta: "Las observaciones" })],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(loteEstados, "El estado")],
  };
}
