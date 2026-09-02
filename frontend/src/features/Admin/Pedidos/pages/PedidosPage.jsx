import { FileText } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { endpoints } from "@/shared/services/endpoints";
import { formatFecha, nombreCliente } from "@/shared/utils/formatters";
import { crearPedidoEsquema } from "../validations/pedidoValidation";

/**
 * Modulo Pedidos -> tabla `pedidos`.
 * No es un modulo de ventas: es el compromiso de entrega con el cliente
 * (cantidad y fecha), contra el que se proyecta el avance de produccion.
 */
const estados = [
  { value: "REGISTRADO", label: "Registrado" },
  { value: "APROBADO", label: "Aprobado" },
  { value: "EN_PRODUCCION", label: "En produccion" },
  { value: "DESPACHADO", label: "Despachado" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function PedidosPage() {
  const clientes = useCatalogo(endpoints.clientes, {
    valor: "id_cliente",
    etiqueta: (fila) => nombreCliente(fila),
    filtros: { estado: "ACTIVO" },
  });
  const marcas = useCatalogo(endpoints.marcas, { valor: "id_marca", etiqueta: "nombre" });

  return (
    <CrudPage
      titulo="Pedidos"
      subtitulo="Compromisos de entrega con el cliente"
      recurso={endpoints.pedidos}
      idField="id_pedido"
      etiquetaNuevo="Nuevo pedido"
      busquedaPlaceholder="Buscar por numero de pedido u observaciones..."
      nombreRegistro={(fila) => (fila?.numero_pedido ? `el pedido ${fila.numero_pedido}` : "el pedido")}
      emptyIcon={FileText}
      emptyTitle="No hay pedidos registrados"
      emptyDescription="El pedido guarda la cantidad y la fecha comprometida con el cliente."
      ordenInicial={{ campo: "fecha_pedido", direccion: "desc" }}
      permiteEstado={false}
      filtrosLista={[
        { clave: "estado", label: "Estado", etiquetaTodos: "Todos los estados", opciones: estados },
        {
          clave: "id_cliente",
          label: "Cliente",
          etiquetaTodos: "Todos los clientes",
          opciones: clientes.options,
        },
        { clave: "id_marca", label: "Marca", etiquetaTodos: "Todas las marcas", opciones: marcas.options },
      ]}
      columnas={[
        { key: "numero_pedido", header: "N. Pedido" },
        { key: "nombre_cliente", header: "Cliente" },
        { key: "nombre_marca", header: "Marca" },
        { key: "fecha_pedido", header: "Fecha", render: (fila) => formatFecha(fila.fecha_pedido) },
        {
          key: "fecha_entrega_programada",
          header: "Entrega",
          render: (fila) => formatFecha(fila.fecha_entrega_programada),
        },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{
        numero_pedido: "",
        id_cliente: "",
        id_marca: "",
        fecha_pedido: "",
        fecha_entrega_programada: "",
        fecha_entrega_real: "",
        estado: "REGISTRADO",
        observaciones: "",
      }}
      required={["numero_pedido", "id_cliente", "fecha_pedido"]}
      esquema={({ items, editing }) =>
        crearPedidoEsquema({
          lista: items,
          editing,
          clienteOptions: clientes.options,
          marcaOptions: marcas.options,
        })
      }
      transformarPayload={(datos) => ({
        ...datos,
        id_cliente: Number(datos.id_cliente),
        id_marca: datos.id_marca ? Number(datos.id_marca) : null,
      })}
      campos={[
        {
          name: "numero_pedido",
          label: "Numero de pedido",
          placeholder: "PED-2026-001",
          required: true,
          maxLength: 30,
        },
        {
          name: "id_cliente",
          label: "Cliente",
          options: clientes.options,
          emptyOption: "Seleccionar cliente",
          required: true,
        },
        { name: "id_marca", label: "Marca", options: marcas.options, emptyOption: "Sin marca" },
        { name: "estado", label: "Estado", options: estados, required: true },
        { name: "fecha_pedido", label: "Fecha del pedido", type: "date", required: true },
        {
          name: "fecha_entrega_programada",
          label: "Entrega programada",
          type: "date",
          hint: "Contra esta fecha se proyecta el avance.",
        },
        {
          name: "fecha_entrega_real",
          label: "Entrega real",
          type: "date",
        },
        { name: "observaciones", label: "Observaciones", type: "textarea", ancho: "completo" },
      ]}
    />
  );
}
