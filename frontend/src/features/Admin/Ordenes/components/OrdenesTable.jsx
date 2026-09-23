import { DataTable } from "@/shared/components/DataTable";
import { Progress } from "@/shared/components/progress";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatNumero, GUION } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la vista `vw_avance_orden`.
 * Las comparte la tabla y la exportacion a CSV.
 */
export function columnasOrdenes({ onView, onEdit, onDelete } = {}) {
  return [
    {
      key: "numero_orden",
      header: "N. Orden",
      sortable: true,
      render: (orden) => <span className="font-medium text-gray-900">{orden.numero_orden}</span>,
      exportar: (orden) => orden.numero_orden,
    },
    {
      key: "nombre_cliente",
      header: "Cliente",
      sortable: true,
      render: (orden) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-800">{orden.nombre_cliente || GUION}</p>
          <p className="truncate text-xs text-gray-400">{orden.nombre_referencia || GUION}</p>
        </div>
      ),
      exportar: (orden) => orden.nombre_cliente || "",
    },
    { key: "codigo_lote", header: "Lote", sortable: true },
    {
      key: "codigo_modulo",
      header: "Modulo",
      sortable: true,
      // La orden no pertenece a un modulo: o esta libre, o la tomo uno al
      // abrir su jornada. Mientras este libre cualquiera puede cogerla.
      render: (orden) =>
        orden.codigo_modulo ? (
          <span className="text-gray-700">{orden.codigo_modulo}</span>
        ) : (
          <span className="rounded-md bg-[#D08E10]/10 px-2 py-0.5 text-xs font-medium text-[#b46a12]">
            Libre
          </span>
        ),
      exportar: (orden) => orden.codigo_modulo || "Libre",
    },
    {
      key: "codigo_referencia",
      header: "Referencia",
      sortable: true,
      render: (orden) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-800">{orden.codigo_referencia || GUION}</p>
          <p className="truncate text-xs text-gray-400">{orden.codigo_ficha || GUION}</p>
        </div>
      ),
      exportar: (orden) => orden.codigo_referencia || "",
    },
    {
      key: "porcentaje_avance",
      header: "Avance",
      sortable: true,
      render: (orden) => (
        <div className="w-28">
          <Progress value={Number(orden.porcentaje_avance || 0)} className="h-2" />
          {/* La vista la llama `unidades_producidas`. Decia
              `cantidad_producida`, que no existe, asi que el numerador
              salia en 0 aunque la barra si se moviera. */}
          <span className="mt-1 block text-xs text-gray-500">
            {formatNumero(orden.unidades_producidas)} / {formatNumero(orden.cantidad_programada)}
          </span>
        </div>
      ),
      exportar: (orden) => `${Number(orden.porcentaje_avance || 0)}%`,
    },
    {
      key: "prioridad",
      header: "Prioridad",
      sortable: true,
      render: (orden) => <StatusBadge status={orden.prioridad} />,
      exportar: (orden) => orden.prioridad,
    },
    {
      key: "fecha_emision",
      header: "Emision",
      sortable: true,
      render: (orden) => formatFecha(orden.fecha_emision),
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (orden) => <StatusBadge status={orden.estado} />,
      exportar: (orden) => orden.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (orden) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: orden, onDetalle: onView, onEdit, onDelete })}
        />
      ),
    },
  ];
}

/** Listado de la vista `vw_avance_orden`. */
export function OrdenesTable({ columnas, orders = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={orders}
      loading={loading}
      rowKey="id_orden_produccion"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
