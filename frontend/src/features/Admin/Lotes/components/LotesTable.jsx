import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatNumero, GUION } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la tabla `lotes`.
 * Las comparte la tabla, el modo lista y la exportacion a CSV.
 *
 * El estado de un lote es su avance (REGISTRADO, EN_PROCESO, FINALIZADO,
 * CANCELADO) mas INACTIVO, asi que "activo" es todo lo que no esta
 * inactivo: no sirve el ACTIV* que usa el resto del panel.
 */
export function columnasLotes({ nombreCliente, onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "codigo_lote",
      header: "Codigo",
      sortable: true,
      render: (lote) => (
        <span className="font-mono text-sm font-medium text-[#0F4C3F]">{lote.codigo_lote}</span>
      ),
      exportar: (lote) => lote.codigo_lote,
    },
    {
      key: "numero_pedido",
      header: "Pedido",
      sortable: true,
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
      render: (lote) =>
        lote.nombre_tipo_prenda || <span className="text-gray-300">{GUION}</span>,
      exportar: (lote) => lote.nombre_tipo_prenda || "",
    },
    {
      key: "sam_pactado",
      header: "SAM",
      align: "right",
      sortable: true,
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
      key: "cantidad_programada",
      header: "Programada",
      align: "right",
      sortable: true,
      render: (lote) => (
        <span className="font-medium text-gray-900">{formatNumero(lote.cantidad_programada)}</span>
      ),
      exportar: (lote) => Number(lote.cantidad_programada || 0),
    },
    {
      key: "cantidad_recibida",
      header: "Recibida",
      align: "right",
      sortable: true,
      render: (lote) => formatNumero(lote.cantidad_recibida),
      exportar: (lote) => Number(lote.cantidad_recibida || 0),
    },
    {
      key: "fecha_recepcion",
      header: "Recepcion",
      sortable: true,
      render: (lote) => formatFecha(lote.fecha_recepcion),
    },
    {
      key: "fecha_entrega_programada",
      header: "Entrega",
      sortable: true,
      render: (lote) =>
        lote.fecha_entrega_programada ? (
          formatFecha(lote.fecha_entrega_programada)
        ) : (
          <span className="text-gray-300">{GUION}</span>
        ),
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
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
            activo: String(lote.estado).toUpperCase() !== "INACTIVO",
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
