import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de causa -> tabla `causas_desviacion`.
 * Es el catalogo de botones que ve la supervisora cuando una hora no alcanza
 * la meta, por eso el codigo y el nombre son cortos y no se repiten.
 */
export const causaLimites = {
  codigo: { min: 2, max: 30 },
  nombre: { min: 3, max: 80 },
  responsable: { max: 60 },
  ordenVisual: { min: 1, max: 99 },
};

export const causaTipos = ["PLANEADA", "INTERNA", "EXTERNA"];
export const causaEstados = ["ACTIVO", "INACTIVO"];

export function crearCausaEsquema({ lista = [], editing = null } = {}) {
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
    nombre: [
      reglas.requerido("El nombre"),
      reglas.longitud({ ...causaLimites.nombre, etiqueta: "El nombre" }),
    ],
    tipo: [reglas.seleccionRequerida("El tipo"), reglas.opcionValida(causaTipos, "El tipo")],
    responsable: [reglas.longitud({ ...causaLimites.responsable, etiqueta: "El responsable" })],
    orden_visual: [
      reglas.entero({ etiqueta: "El orden en pantalla" }),
      reglas.numero({ ...causaLimites.ordenVisual, etiqueta: "El orden en pantalla" }),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(causaEstados, "El estado")],
  };
}
