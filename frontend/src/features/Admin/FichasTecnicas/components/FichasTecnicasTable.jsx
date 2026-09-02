import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, GUION } from "@/shared/utils/formatters";

/**
 * Columnas del listado de `fichas_tecnicas`.
 * Las comparte la vista de tabla, el modo lista y la exportacion a CSV.
 */
export function columnasFichas({ onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "codigo_ficha",
      header: "Ficha",
      sortable: true,
      render: (ficha) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{ficha.codigo_ficha}</p>
          <p className="truncate text-xs text-gray-400">version {ficha.version}</p>
        </div>
      ),
      exportar: (ficha) => ficha.codigo_ficha,
    },
    { key: "version", header: "Version", sortable: true, oculta: true },
    {
      key: "codigo_referencia",
      header: "Referencia",
      sortable: true,
      render: (ficha) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-800">{ficha.codigo_referencia || GUION}</p>
          <p className="truncate text-xs text-gray-400">{ficha.nombre_referencia || ""}</p>
        </div>
      ),
      exportar: (ficha) => ficha.codigo_referencia || "",
    },
    { key: "nombre_marca", header: "Marca", sortable: true },
    {
      key: "sam_pactado",
      header: "SAM",
      align: "right",
      sortable: true,
      render: (ficha) =>
        Number(ficha.sam_pactado || 0) > 0 ? (
          <span className="font-medium text-gray-900">{Number(ficha.sam_pactado).toFixed(2)} min</span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">
            Sin SAM
          </span>
        ),
      exportar: (ficha) => Number(ficha.sam_pactado || 0),
    },
    {
      key: "personal_requerido",
      header: "Personal",
      align: "center",
      sortable: true,
      render: (ficha) => ficha.personal_requerido ?? GUION,
      exportar: (ficha) => ficha.personal_requerido ?? "",
    },
    {
      key: "fecha_vigencia",
      header: "Vigencia",
      sortable: true,
      render: (ficha) => formatFecha(ficha.fecha_vigencia),
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (ficha) => <StatusBadge status={ficha.estado} />,
      exportar: (ficha) => ficha.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (ficha) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({
            fila: ficha,
            onDetalle,
            onEdit,
            onToggleEstado,
            onDelete,
            activo: String(ficha.estado).toUpperCase() === "VIGENTE",
          })}
        />
      ),
    },
  ];
}

export function FichasTecnicasTable({ columnas, fichas = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={fichas}
      loading={loading}
      rowKey="id_ficha_tecnica"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
