import { reglas } from "@/shared/validations";

/**
 * Reglas del catalogo de tallas -> tabla `tallas`.
 *
 * Una sola lista mezcla las tres familias que maneja la empresa (adulto
 * XS-5XL, numerica 26-42, infantil 1T-5T y 2-14): la digitadora escoge a
 * mano la que corresponda a la prenda del lote, no hay filtro automatico
 * por cliente.
 */
export const tallaLimites = {
  nombre: { min: 1, max: 20 },
  ordenVisual: { min: 1, max: 999 },
};

export const tallaEstados = ["ACTIVO", "INACTIVO"];

export function crearTallaEsquema({ lista = [], editing = null } = {}) {
  return {
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...tallaLimites.nombre, etiqueta: "El nombre" }),
      reglas.unico({
        lista,
        campo: "nombre",
        idField: "id_talla",
        actual: editing,
        etiqueta: "Esa talla",
      }),
    ],
    orden_visual: [
      reglas.entero({ etiqueta: "El orden en pantalla" }),
      reglas.numero({ ...tallaLimites.ordenVisual, etiqueta: "El orden en pantalla" }),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(tallaEstados, "El estado")],
  };
}
