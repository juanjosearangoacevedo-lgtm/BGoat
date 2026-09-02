import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de prenda -> tabla `prendas`.
 * Una prenda es la combinacion referencia + tipo + talla + color (el SKU),
 * y el SKU no puede repetirse en el catalogo.
 */
export const prendaLimites = {
  sku: { min: 3, max: 50 },
  nombre: { min: 3, max: 100 },
  descripcion: { max: 255 },
};

export const prendaEstados = ["ACTIVO", "INACTIVO"];

export function crearPrendaEsquema({
  lista = [],
  editing = null,
  referenciaOptions = [],
  tipoOptions = [],
  tallaOptions = [],
  colorOptions = [],
} = {}) {
  return {
    id_referencia: [
      reglas.seleccionRequerida("La referencia"),
      reglas.opcionValida(referenciaOptions, "La referencia seleccionada"),
    ],
    id_tipo_prenda: [
      reglas.seleccionRequerida("El tipo de prenda"),
      reglas.opcionValida(tipoOptions, "El tipo de prenda seleccionado"),
    ],
    id_talla: [
      reglas.seleccionRequerida("La talla"),
      reglas.opcionValida(tallaOptions, "La talla seleccionada"),
    ],
    id_color: [
      reglas.seleccionRequerida("El color"),
      reglas.opcionValida(colorOptions, "El color seleccionado"),
    ],
    sku: [
      reglas.requerido("El SKU"),
      reglas.longitud({ ...prendaLimites.sku, etiqueta: "El SKU" }),
      reglas.sinCaracteresEspeciales("El SKU"),
      reglas.unico({
        lista,
        campo: "sku",
        idField: "id_prenda",
        actual: editing,
        etiqueta: "Ese SKU",
      }),
    ],
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...prendaLimites.nombre, etiqueta: "El nombre" }),
    ],
    descripcion: [reglas.longitud({ ...prendaLimites.descripcion, etiqueta: "La descripcion" })],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(prendaEstados, "El estado")],
  };
}
