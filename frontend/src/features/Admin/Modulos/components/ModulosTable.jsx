import { Factory } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatNumero, GUION } from "@/shared/utils/formatters";

/**
 * Columnas del listado de `modulos` cruzado con su estado del dia.
 * Las comparte la vista de tabla, el modo lista y la exportacion a CSV.
 */
export function columnasModulos({ onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "codigo",
      header: "Modulo",
      sortable: true,
      render: (modulo) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#433A9B]/10 text-[#433A9B]">
            <Factory className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{modulo.nombre}</p>
            <p className="truncate text-xs text-gray-400">{modulo.codigo}</p>
          </div>
        </div>
      ),
      exportar: (modulo) => modulo.codigo,
    },
    {
      key: "ubicacion",
      header: "Ubicacion",
      sortable: true,
      render: (modulo) => modulo.ubicacion || <span className="text-gray-300">{GUION}</span>,
      exportar: (modulo) => modulo.ubicacion || "",
    },
    {
      key: "capacidad_operarios",
      header: "Personal",
      align: "center",
      sortable: true,
      render: (modulo) => (
        <span className="text-sm text-gray-700">
          {Math.round(Number(modulo.promedio_personas || 0))} / {Number(modulo.capacidad_operarios || 0)}
        </span>
      ),
      exportar: (modulo) => Number(modulo.capacidad_operarios || 0),
    },
    {
      key: "unidades_producidas",
      header: "Producido hoy",
      align: "right",
      sortable: true,
      render: (modulo) => formatNumero(modulo.unidades_producidas),
      exportar: (modulo) => Number(modulo.unidades_producidas || 0),
    },
    {
      key: "eficiencia",
      header: "Eficiencia",
      sortable: true,
      render: (modulo) => {
        const eficiencia = Math.round(Number(modulo.eficiencia || 0));
        return (
          <div className="w-24">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${eficiencia >= 100 ? "bg-green-500" : "bg-[#433A9B]"}`}
                style={{ width: `${Math.min(eficiencia, 100)}%` }}
              />
            </div>
            <span className="mt-1 block text-xs text-gray-400">{eficiencia}%</span>
          </div>
        );
      },
      exportar: (modulo) => `${Math.round(Number(modulo.eficiencia || 0))}%`,
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (modulo) => <StatusBadge status={modulo.estado} />,
      exportar: (modulo) => modulo.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (modulo) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: modulo, onDetalle, onEdit, onToggleEstado, onDelete })}
        />
      ),
    },
  ];
}

export function ModulosTable({ columnas, modulos = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={modulos}
      loading={loading}
      rowKey="id_modulo"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
