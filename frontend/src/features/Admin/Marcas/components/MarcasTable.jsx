import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, iniciales } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la tabla `marcas`.
 * Las comparte la vista de tabla, el modo lista y la exportacion a CSV.
 */
export function columnasMarcas({ onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "nombre",
      header: "Marca",
      sortable: true,
      render: (marca) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#433A9B] to-[#5a4fb8] text-xs font-bold text-white">
            {iniciales(marca.nombre)}
          </div>
          <span className="font-medium text-gray-900">{marca.nombre}</span>
        </div>
      ),
      exportar: (marca) => marca.nombre,
    },
    {
      key: "descripcion",
      header: "Descripcion",
      sortable: true,
      render: (marca) => (
        <span className={marca.descripcion ? "" : "text-gray-300"}>
          {marca.descripcion || "Sin descripcion"}
        </span>
      ),
      exportar: (marca) => marca.descripcion || "",
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (marca) => <StatusBadge status={marca.estado} />,
      exportar: (marca) => marca.estado,
    },
    {
      key: "fecha_creacion",
      header: "Registrada",
      sortable: true,
      render: (marca) => formatFecha(marca.fecha_creacion),
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (marca) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: marca, onDetalle, onEdit, onToggleEstado, onDelete })}
        />
      ),
    },
  ];
}

export function MarcasTable({ columnas, marcas = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={marcas}
      loading={loading}
      rowKey="id_marca"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
