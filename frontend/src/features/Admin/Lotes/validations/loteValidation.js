import { estaVacio, reglas } from "@/shared/validations";

/**
 * Reglas del formulario de lote -> tabla `lotes`.
 *
 * El lote llega del cliente y trae TODO lo del trabajo: el folio del
 * pedido, la referencia, el tipo de prenda, el SAM pactado y el valor de
 * maquila, la ficha tecnica y --opcionalmente-- el desglose por talla y
 * color.
 *
 * Antes eso vivia en cinco tablas aparte (`pedidos`, `detalle_pedido`,
 * `referencias`, `fichas_tecnicas` y `prendas`) con su propia pantalla
 * cada una: para registrar un trabajo que llega en una sola hoja habia
 * que recorrer cinco formularios, y tres de esos registros se usaban una
 * sola vez.
 *
 * Sin material principal ni fecha de pedido: no los usaba ningun
 * calculo, reporte ni pantalla mas alla de este formulario. Las fechas
 * de cuando empieza y termina la produccion viven en la orden
 * (`fecha_inicio_programada` / `fecha_fin_programada` de
 * `ordenes_produccion`), no aqui: un lote corre en una sola orden, y
 * tenerlas en los dos lados dejaba que se desincronizaran.
 */
export const loteLimites = {
  pedido: { max: 50 },
  referencia: { max: 50 },
  nombreReferencia: { max: 120 },
  cantidad: { min: 0, max: 999999 },
  sam: { min: 0.01, max: 999 },
  valorMaquila: { min: 0.01, max: 9999999 },
  observaciones: { max: 255 },
};

/**
 * El ciclo de vida del lote, solo para mostrarlo (badge, filtro): ya no
 * se escoge en el formulario. Pendiente es donde nace, En proceso lo
 * pone el backend al abrir jornada, y Finalizado lo pone solo al
 * completarse la cantidad programada de su orden.
 */
export const loteEstados = ["PENDIENTE", "EN_PROCESO", "FINALIZADO"];

/**
 * Lo que identifica al lote: el numero de pedido, el codigo de referencia
 * o el nombre de la referencia, segun lo que traiga la hoja del cliente.
 * Hace falta al menos uno (se pueden llenar los tres). El codigo de lote
 * no cuenta: no se digita, lo asigna el backend.
 *
 * El backend exige lo mismo; esto solo le ahorra el viaje al servidor y
 * senala los tres campos de los que hay que llenar uno.
 */
export const camposIdentificacionLote = ["numero_pedido", "codigo_referencia", "nombre_referencia"];

export const MENSAJE_IDENTIFICACION_LOTE =
  "Hace falta al menos uno: número de pedido, código de referencia o nombre de la referencia.";

function identificacionLote(_valor, form = {}) {
  return camposIdentificacionLote.some((campo) => !estaVacio(form[campo]))
    ? ""
    : MENSAJE_IDENTIFICACION_LOTE;
}

export function crearLoteEsquema({ lista = [], editing = null, clienteOptions = [], desglose = [] } = {}) {
  const sumaDesglose = desglose.reduce((total, fila) => total + Number(fila.cantidad || 0), 0);

  return {
    id_cliente: [
      reglas.seleccionRequerida("El cliente"),
      reglas.opcionValida(clienteOptions, "El cliente seleccionado"),
    ],
    numero_pedido: [
      identificacionLote,
      reglas.longitud({ ...loteLimites.pedido, etiqueta: "El número de pedido" }),
      reglas.unico({
        lista,
        campo: "numero_pedido",
        idField: "id_lote",
        actual: editing,
        etiqueta: "Ese número de pedido",
      }),
    ],
    codigo_referencia: [
      identificacionLote,
      reglas.longitud({ ...loteLimites.referencia, etiqueta: "El código de referencia" }),
    ],
    nombre_referencia: [
      identificacionLote,
      reglas.longitud({ ...loteLimites.nombreReferencia, etiqueta: "El nombre de la referencia" }),
    ],
    // El SAM no es obligatorio para GUARDAR el lote --a veces llega antes
    // que el acuerdo-- pero si para iniciar la jornada: sin él no hay meta.
    // El aviso lo da la pantalla, aqui solo se valida que sea un numero.
    sam_pactado: [
      reglas.numero({ ...loteLimites.sam, etiqueta: "El SAM pactado" }),
    ],
    // El valor de maquila si es obligatorio: a diferencia del SAM, la
    // empresa necesita ver desde el primer dia cuanto genera cada modulo
    // en pesos, no solo en unidades o porcentaje.
    valor_maquila_unidad: [
      (valor) =>
        Number(valor) > 0
          ? ""
          : 'Falta el valor de maquila: escribe el precio pactado en "Calcular", junto al SAM.',
      reglas.numero({ ...loteLimites.valorMaquila, etiqueta: "El valor de maquila" }),
    ],
    fecha_recepcion: [
      reglas.requerido("La fecha de recepción"),
      reglas.fecha({ etiqueta: "La fecha de recepción" }),
      reglas.noFutura({ etiqueta: "La fecha de recepción" }),
    ],
    // Ya no se digita: la suma la define el desglose por talla y color.
    cantidad_programada: [
      () =>
        sumaDesglose > 0
          ? ""
          : "Agrega al menos una fila de talla y color con una cantidad mayor a cero.",
    ],
    observaciones: [reglas.longitud({ ...loteLimites.observaciones, etiqueta: "Las observaciones" })],
  };
}
