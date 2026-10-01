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
  codigo: { min: 3, max: 30 },
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
 * El lote no exige codigo de lote por si solo: con que traiga codigo de
 * referencia o nombre de referencia alcanza para identificarlo (asi lo
 * aclaro German). Si ninguno de los tres llega, el backend tampoco deja
 * guardar -- esto solo le ahorra el viaje al servidor.
 */
function identificacionLote(_valor, form = {}) {
  const tieneAlguno =
    !estaVacio(form.codigo_lote) || !estaVacio(form.codigo_referencia) || !estaVacio(form.nombre_referencia);
  return tieneAlguno
    ? ""
    : "Hace falta al menos uno: codigo de lote, codigo de referencia o nombre de referencia.";
}

export function crearLoteEsquema({ lista = [], editing = null, clienteOptions = [] } = {}) {
  return {
    codigo_lote: [
      identificacionLote,
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
    nombre_referencia: [
      reglas.longitud({ ...loteLimites.nombreReferencia, etiqueta: "El nombre de la referencia" }),
    ],
    // El SAM no es obligatorio para GUARDAR el lote --a veces llega antes
    // que el acuerdo-- pero si para iniciar la jornada: sin el no hay meta.
    // El aviso lo da la pantalla, aqui solo se valida que sea un numero.
    sam_pactado: [
      reglas.numero({ ...loteLimites.sam, etiqueta: "El SAM pactado" }),
    ],
    // El valor de maquila si es obligatorio: a diferencia del SAM, la
    // empresa necesita ver desde el primer dia cuanto genera cada modulo
    // en pesos, no solo en unidades o porcentaje.
    valor_maquila_unidad: [
      reglas.requerido("El valor de maquila"),
      reglas.numero({ ...loteLimites.valorMaquila, etiqueta: "El valor de maquila" }),
    ],
    fecha_recepcion: [
      reglas.requerido("La fecha de recepcion"),
      reglas.fecha({ etiqueta: "La fecha de recepcion" }),
      reglas.noFutura({ etiqueta: "La fecha de recepcion" }),
    ],
    fecha_entrega_programada: [reglas.fecha({ etiqueta: "La fecha de entrega programada" })],
    cantidad_programada: [
      reglas.entero({ etiqueta: "La cantidad programada" }),
      reglas.numero({ ...loteLimites.cantidad, etiqueta: "La cantidad programada" }),
    ],
    cantidad_recibida: [
      reglas.entero({ etiqueta: "La cantidad recibida" }),
      reglas.numero({ ...loteLimites.cantidad, etiqueta: "La cantidad recibida" }),
    ],
    observaciones: [reglas.longitud({ ...loteLimites.observaciones, etiqueta: "Las observaciones" })],
  };
}
