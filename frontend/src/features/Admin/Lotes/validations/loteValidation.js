import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de lote -> tabla `lotes`.
 *
 * El lote llega del cliente y trae TODO lo del trabajo: el folio del
 * pedido y sus fechas, la referencia, el tipo de prenda, el SAM pactado,
 * la ficha tecnica y --opcionalmente-- el desglose por talla y color.
 *
 * Antes eso vivia en cinco tablas aparte (`pedidos`, `detalle_pedido`,
 * `referencias`, `fichas_tecnicas` y `prendas`) con su propia pantalla
 * cada una: para registrar un trabajo que llega en una sola hoja habia
 * que recorrer cinco formularios, y tres de esos registros se usaban una
 * sola vez.
 *
 * La recepcion es un hecho ya ocurrido, y las fechas de inicio y
 * finalizacion van despues de ella.
 */
export const loteLimites = {
  codigo: { min: 3, max: 30 },
  pedido: { max: 50 },
  referencia: { max: 50 },
  nombreReferencia: { max: 120 },
  material: { max: 150 },
  cantidad: { min: 0, max: 999999 },
  sam: { min: 0.01, max: 999 },
  observaciones: { max: 255 },
};

/**
 * El ciclo de vida completo del lote. Los cinco primeros venian de
 * `lotes` y los tres del medio de `pedidos`: al fusionarse las dos
 * tablas, el estado tambien se fusiono.
 */
export const loteEstados = [
  "REGISTRADO",
  "APROBADO",
  "EN_PROCESO",
  "DESPACHADO",
  "ENTREGADO",
  "FINALIZADO",
  "CANCELADO",
  "INACTIVO",
];

export function crearLoteEsquema({ lista = [], editing = null, clienteOptions = [] } = {}) {
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
    id_cliente: [
      reglas.seleccionRequerida("El cliente"),
      reglas.opcionValida(clienteOptions, "El cliente seleccionado"),
    ],
    numero_pedido: [
      reglas.longitud({ ...loteLimites.pedido, etiqueta: "El numero de pedido" }),
      reglas.unico({
        lista,
        campo: "numero_pedido",
        idField: "id_lote",
        actual: editing,
        etiqueta: "Ese numero de pedido",
      }),
    ],
    codigo_referencia: [
      reglas.longitud({ ...loteLimites.referencia, etiqueta: "El codigo de referencia" }),
    ],
    material_principal: [
      reglas.longitud({ ...loteLimites.material, etiqueta: "El material principal" }),
    ],
    nombre_referencia: [
      reglas.longitud({ ...loteLimites.nombreReferencia, etiqueta: "El nombre de la referencia" }),
    ],
    // El SAM no es obligatorio para GUARDAR el lote --a veces llega antes
    // que el acuerdo-- pero si para iniciar la jornada: sin el no hay meta.
    // El aviso lo da la pantalla, aqui solo se valida que sea un numero.
    sam_pactado: [
      reglas.numero({ ...loteLimites.sam, etiqueta: "El SAM pactado" }),
    ],
    fecha_recepcion: [
      reglas.requerido("La fecha de recepcion"),
      reglas.fecha({ etiqueta: "La fecha de recepcion" }),
      reglas.noFutura({ etiqueta: "La fecha de recepcion" }),
    ],
    fecha_pedido: [
      reglas.fecha({ etiqueta: "La fecha del pedido" }),
      reglas.noFutura({ etiqueta: "La fecha del pedido" }),
    ],
    fecha_entrega_programada: [reglas.fecha({ etiqueta: "La fecha de entrega programada" })],
    fecha_entrega_real: [
      reglas.fecha({ etiqueta: "La fecha de entrega real" }),
      reglas.noFutura({ etiqueta: "La fecha de entrega real" }),
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
