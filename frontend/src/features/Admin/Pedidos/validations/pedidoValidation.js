import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de pedido -> tabla `pedidos`.
 * El pedido es el compromiso de entrega con el cliente: la entrega
 * programada y la real van despues de la fecha del pedido.
 */
export const pedidoLimites = {
  numero: { min: 3, max: 30 },
  observaciones: { max: 255 },
};

export const pedidoEstados = [
  "REGISTRADO",
  "APROBADO",
  "EN_PRODUCCION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
];

export function crearPedidoEsquema({
  lista = [],
  editing = null,
  clienteOptions = [],
  marcaOptions = [],
} = {}) {
  return {
    numero_pedido: [
      reglas.requerido("El numero de pedido"),
      reglas.longitud({ ...pedidoLimites.numero, etiqueta: "El numero de pedido" }),
      reglas.sinCaracteresEspeciales("El numero de pedido"),
      reglas.unico({
        lista,
        campo: "numero_pedido",
        idField: "id_pedido",
        actual: editing,
        etiqueta: "Ese numero de pedido",
      }),
    ],
    id_cliente: [
      reglas.seleccionRequerida("El cliente"),
      reglas.opcionValida(clienteOptions, "El cliente seleccionado"),
    ],
    id_marca: [reglas.opcionValida(marcaOptions, "La marca seleccionada")],
    fecha_pedido: [
      reglas.requerido("La fecha del pedido"),
      reglas.fecha({ etiqueta: "La fecha del pedido" }),
      reglas.noFutura({ etiqueta: "La fecha del pedido" }),
    ],
    fecha_entrega_programada: [
      reglas.fecha({ etiqueta: "La entrega programada" }),
      reglas.posteriorA("fecha_pedido", "La entrega programada", "la fecha del pedido"),
    ],
    fecha_entrega_real: [
      reglas.fecha({ etiqueta: "La entrega real" }),
      reglas.posteriorA("fecha_pedido", "La entrega real", "la fecha del pedido"),
    ],
    observaciones: [
      reglas.longitud({ ...pedidoLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
    estado: [reglas.seleccionRequerida("El estado"), reglas.opcionValida(pedidoEstados, "El estado")],
  };
}
