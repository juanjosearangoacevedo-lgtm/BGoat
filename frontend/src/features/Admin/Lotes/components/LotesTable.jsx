import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatNumero, GUION } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la tabla `lotes`.
 * Las comparte la tabla, el modo lista y la exportacion a CSV.
 *
 * `estado` (Pendiente, En proceso, Finalizado) y `activo` (si se sigue
 * ofreciendo) son columnas independientes: el interruptor de la fila
 * cambia `activo`, no `estado`.
 *
 * La tabla muestra solo cinco: codigo, cliente, referencia, cantidad y
 * entrega. El resto lleva `oculta: true`: no se pinta pero si sale en la
 * exportacion, y se ve completo en el detalle (ojo).
 */
export function columnasLotes({ nombreCliente, onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "codigo_lote",
      header: "Codigo",
      sortable: true,
      render: (lote) => (
        <span className="font-mono text-sm font-medium text-marca-letra">{lote.codigo_lote}</span>
      ),
      exportar: (lote) => lote.codigo_lote,
    },
    {
      key: "numero_pedido",
      header: "Pedido",
      sortable: true,
      oculta: true,
      render: (lote) =>
        lote.numero_pedido || <span className="text-gray-300">{GUION}</span>,
      exportar: (lote) => lote.numero_pedido || "",
    },
    {
      key: "nombre_cliente",
      header: "Cliente",
      sortable: true,
      render: (lote) => lote.nombre_cliente || nombreCliente?.(lote.id_cliente) || lote.id_cliente,
      exportar: (lote) => lote.nombre_cliente || nombreCliente?.(lote.id_cliente) || "",
    },
    {
      key: "codigo_referencia",
      header: "Referencia",
      sortable: true,
      render: (lote) =>
        lote.codigo_referencia ? (
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-900">{lote.codigo_referencia}</p>
            {lote.nombre_referencia && (
              <p className="truncate text-xs text-gray-400">{lote.nombre_referencia}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-300">{GUION}</span>
        ),
      exportar: (lote) => lote.codigo_referencia || "",
    },
    {
      key: "nombre_tipo_prenda",
      header: "Tipo",
      sortable: true,
      oculta: true,
      render: (lote) =>
        lote.nombre_tipo_prenda || <span className="text-gray-300">{GUION}</span>,
      exportar: (lote) => lote.nombre_tipo_prenda || "",
    },
    {
      key: "sam_pactado",
      header: "SAM",
      align: "right",
      sortable: true,
      oculta: true,
      // Un lote sin SAM no deja iniciar la jornada: se marca en rojo para
      // que se vea en el listado y no al momento de arrancar el modulo.
      render: (lote) =>
        Number(lote.sam_pactado) ? (
          <span className="font-medium text-gray-900">{lote.sam_pactado} min</span>
        ) : (
          <span className="font-medium text-red-500">Falta</span>
        ),
      exportar: (lote) => Number(lote.sam_pactado || 0),
    },
    {
      // Programada y recibida son el mismo numero: la suma del desglose
      // por talla y color. Se muestra una sola.
      key: "cantidad_recibida",
      header: "Cantidad",
      align: "right",
      sortable: true,
      render: (lote) => (
        <span className="font-medium text-gray-900">{formatNumero(lote.cantidad_recibida)}</span>
      ),
      exportar: (lote) => Number(lote.cantidad_recibida || 0),
    },
    {
      key: "fecha_recepcion",
      header: "Recepcion",
      sortable: true,
      oculta: true,
      render: (lote) => formatFecha(lote.fecha_recepcion),
    },
    {
      key: "fecha_entrega_programada",
      header: "Entrega",
      sortable: true,
      // La entrega sale de la orden el dia en que inicia jornada (formula
      // de German); antes no hay con que calcularla, y se dice asi en vez
      // de un guion mudo.
      render: (lote) =>
        lote.fecha_entrega_programada ? (
          formatFecha(lote.fecha_entrega_programada)
        ) : (
          <span className="text-xs text-gray-400">Al iniciar jornada</span>
        ),
      exportar: (lote) => lote.fecha_entrega_programada || "",
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      oculta: true,
      render: (lote) => <StatusBadge status={lote.estado} />,
      exportar: (lote) => lote.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (lote) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({
            fila: lote,
            onDetalle,
            onEdit,
            onToggleEstado,
            onDelete,
            activo: Boolean(Number(lote.activo ?? 1)),
          })}
        />
      ),
    },
  ];
}

export function LotesTable({ columnas, lotes = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={lotes}
      loading={loading}
      rowKey="id_lote"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
