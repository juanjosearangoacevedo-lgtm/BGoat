import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de causa -> tabla `causas_desviacion`.
 * Es el catalogo de botones que ve la digitadora cuando una hora no alcanza
 * la meta. El codigo ES el nombre de la causa y no se repite; la
 * descripcion es opcional. El responsable sale del catalogo `responsables`.
 */
export const causaLimites = {
  codigo: { min: 2, max: 100 },
  descripcion: { max: 255 },
  ordenVisual: { min: 1, max: 99 },
};

export const causaTipos = ["PLANEADA", "INTERNA", "EXTERNA"];
export const causaEstados = ["ACTIVO", "INACTIVO"];

export function crearCausaEsquema({ lista = [], editing = null, responsableOptions = [] } = {}) {
  return {
    codigo: [
      reglas.requerido("El codigo"),
      reglas.longitud({ ...causaLimites.codigo, etiqueta: "El codigo" }),
      reglas.sinCaracteresEspeciales("El codigo"),
      reglas.unico({
        lista,
        campo: "codigo",
        idField: "id_causa",
        actual: editing,
        etiqueta: "Ese codigo de causa",
      }),
    ],
    descripcion: [reglas.longitud({ ...causaLimites.descripcion, etiqueta: "La descripcion" })],
    tipo: [reglas.seleccionRequerida("El tipo"), reglas.opcionValida(causaTipos, "El tipo")],
    id_responsable: [
      (valor) =>
        !valor || responsableOptions.some((opcion) => String(opcion.value) === String(valor))
          ? ""
          : "El responsable seleccionado no existe",
    ],
    orden_visual: [
      reglas.entero({ etiqueta: "El orden en pantalla" }),
      reglas.numero({ ...causaLimites.ordenVisual, etiqueta: "El orden en pantalla" }),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(causaEstados, "El estado")],
  };
}
