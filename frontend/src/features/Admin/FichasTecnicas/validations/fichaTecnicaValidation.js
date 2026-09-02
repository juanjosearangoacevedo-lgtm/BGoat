import { estaVacio, reglas } from "@/shared/validations";

/**
 * Reglas del formulario de ficha tecnica -> tabla `fichas_tecnicas`.
 *
 * `sam_pactado` es el minuto estandar negociado con el cliente: sin el, el
 * sistema no puede calcular la meta de cada hora, por eso se exige en las
 * fichas que se marcan como vigentes.
 */
export const fichaLimites = {
  codigo: { min: 3, max: 30 },
  version: { max: 10 },
  descripcion: { max: 255 },
  material: { max: 100 },
  ruta: { max: 255 },
  sam: { min: 0, max: 1000 },
  personal: { min: 0, max: 200 },
};

export const fichaEstados = ["BORRADOR", "VIGENTE", "OBSOLETA", "INACTIVA"];

const FORMATO_VERSION = /^\d+(\.\d+)?$/;

/** El codigo puede repetirse entre versiones, pero no dentro de la misma. */
const codigoVersionUnico =
  (lista, editing) =>
  (valor, form) => {
    if (estaVacio(valor)) return "";

    const repetido = lista.some(
      (ficha) =>
        String(ficha.codigo_ficha || "").trim().toLowerCase() ===
          String(valor).trim().toLowerCase() &&
        String(ficha.version || "") === String(form.version || "") &&
        String(ficha.id_ficha_tecnica) !== String(editing?.id_ficha_tecnica),
    );

    return repetido ? "Ya existe una ficha con ese codigo y esa version" : "";
  };

/** Una ficha vigente sin SAM no sirve: no habria con que calcular la meta. */
const samSegunEstado = (valor, form) =>
  String(form?.estado).toUpperCase() === "VIGENTE" && !Number(valor)
    ? "Una ficha vigente necesita el SAM pactado para calcular la meta horaria"
    : "";

export function crearFichaTecnicaEsquema({ lista = [], editing = null, referenciaOptions = [] } = {}) {
  return {
    id_referencia: [
      reglas.seleccionRequerida("La referencia"),
      reglas.opcionValida(referenciaOptions, "La referencia seleccionada"),
    ],
    codigo_ficha: [
      reglas.requerido("El codigo de la ficha"),
      reglas.longitud({ ...fichaLimites.codigo, etiqueta: "El codigo de la ficha" }),
      reglas.sinCaracteresEspeciales("El codigo de la ficha"),
      codigoVersionUnico(lista, editing),
    ],
    version: [
      reglas.requerido("La version"),
      reglas.patron(FORMATO_VERSION, "La version debe ser un numero como 1.0 o 2"),
      reglas.longitud({ ...fichaLimites.version, etiqueta: "La version" }),
    ],
    descripcion: [reglas.longitud({ ...fichaLimites.descripcion, etiqueta: "La descripcion" })],
    material_principal: [
      reglas.longitud({ ...fichaLimites.material, etiqueta: "El material principal" }),
    ],
    sam_pactado: [
      reglas.numero({ ...fichaLimites.sam, etiqueta: "El SAM pactado" }),
      samSegunEstado,
    ],
    personal_requerido: [
      reglas.entero({ etiqueta: "El personal requerido" }),
      reglas.numero({ ...fichaLimites.personal, etiqueta: "El personal requerido" }),
    ],
    fecha_vigencia: [reglas.fecha({ etiqueta: "La fecha de vigencia" })],
    ruta_imagen: [reglas.longitud({ ...fichaLimites.ruta, etiqueta: "La ruta de imagen" })],
    ruta_documento_pdf: [reglas.longitud({ ...fichaLimites.ruta, etiqueta: "La ruta del PDF" })],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(fichaEstados, "El estado")],
  };
}
