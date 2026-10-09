import { reglas } from "@/shared/validations";

/** Reglas del catalogo de colores -> tabla `colores`. */
const HEX = /^#[0-9A-Fa-f]{6}$/;

export const colorLimites = {
  nombre: { min: 2, max: 50 },
};

export const colorEstados = ["ACTIVO", "INACTIVO"];

export function crearColorEsquema({ lista = [], editing = null } = {}) {
  return {
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...colorLimites.nombre, etiqueta: "El nombre" }),
      reglas.unico({
        lista,
        campo: "nombre",
        idField: "id_color",
        actual: editing,
        etiqueta: "Ese color",
      }),
    ],
    codigo_hex: [reglas.patron(HEX, "El color debe ser un hexadecimal válido (#RRGGBB)")],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(colorEstados, "El estado")],
  };
}
