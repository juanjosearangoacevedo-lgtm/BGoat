import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de marca -> tabla `marcas`.
 * nombre VARCHAR(60) UNIQUE, descripcion VARCHAR(255).
 */
export const marcaLimites = {
  nombre: { min: 2, max: 60 },
  descripcion: { max: 255 },
};

export const marcaEstados = ["ACTIVO", "INACTIVO"];

export function crearMarcaEsquema({ lista = [], editing = null } = {}) {
  return {
    nombre: [
      reglas.requerido("El nombre de la marca"),
      reglas.longitud({ ...marcaLimites.nombre, etiqueta: "El nombre de la marca" }),
      reglas.sinCaracteresEspeciales("El nombre de la marca"),
      reglas.unico({
        lista,
        campo: "nombre",
        idField: "id_marca",
        actual: editing,
        etiqueta: "Esa marca",
      }),
    ],
    descripcion: [reglas.longitud({ ...marcaLimites.descripcion, etiqueta: "La descripcion" })],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(marcaEstados, "El estado")],
  };
}
