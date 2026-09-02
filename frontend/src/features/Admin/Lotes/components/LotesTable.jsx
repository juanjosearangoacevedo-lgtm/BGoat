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
export function columnasLotes({ nombreMarca, onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "codigo_lote",
      header: "Codigo",
      sortable: true,
      render: (lote) => (
        <span className="font-mono text-sm font-medium text-[#433A9B]">{lote.codigo_lote}</span>
      ),
      exportar: (lote) => lote.codigo_lote,
    },
    {
      key: "nombre_marca",
      header: "Marca",
      sortable: true,
      render: (lote) => lote.nombre_marca || nombreMarca?.(lote.id_marca) || lote.id_marca,
      exportar: (lote) => lote.nombre_marca || nombreMarca?.(lote.id_marca) || "",
    },
    {
      key: "numero_pedido",
      header: "Pedido",
      sortable: true,
      render: (lote) => lote.numero_pedido || <span className="text-gray-300">{GUION}</span>,
      exportar: (lote) => lote.numero_pedido || "",
    },
    {
      key: "codigo_referencia",
      header: "Referencia",
      sortable: true,
      render: (lote) => lote.codigo_referencia || <span className="text-gray-300">{GUION}</span>,
      exportar: (lote) => lote.codigo_referencia || "",
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
