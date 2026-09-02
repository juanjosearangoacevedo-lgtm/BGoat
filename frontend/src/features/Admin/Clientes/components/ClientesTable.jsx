import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { documento, iniciales } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la tabla `clientes`.
 * Las comparte la vista de tabla, el modo lista y la exportacion a CSV.
 */
export function columnasClientes({ onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "nombre",
      header: "Cliente",
      sortable: true,
      render: (cliente) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#433A9B]/10 text-xs font-bold text-[#433A9B]">
            {iniciales(cliente.nombre)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{cliente.nombre}</p>
            <p className="truncate text-xs text-gray-400">
              {cliente.razon_social ? "Empresa" : "Persona"}
            </p>
          </div>
        </div>
      ),
      exportar: (cliente) => cliente.nombre,
    },
    {
      key: "numero_documento",
      header: "Documento",
      sortable: true,
      render: (cliente) => documento(cliente),
    },
    {
      key: "correo",
      header: "Correo",
      sortable: true,
      render: (cliente) => cliente.correo || <span className="text-gray-300">Sin correo</span>,
      exportar: (cliente) => cliente.correo || "",
    },
    {
      key: "telefono",
      header: "Telefono",
      sortable: true,
      render: (cliente) => cliente.telefono || <span className="text-gray-300">Sin telefono</span>,
      exportar: (cliente) => cliente.telefono || "",
    },
    {
      key: "direccion",
      header: "Direccion",
      sortable: true,
      render: (cliente) => cliente.direccion || <span className="text-gray-300">Sin direccion</span>,
      exportar: (cliente) => cliente.direccion || "",
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (cliente) => <StatusBadge status={cliente.estado} />,
      exportar: (cliente) => cliente.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (cliente) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: cliente, onDetalle, onEdit, onToggleEstado, onDelete })}
        />
      ),
    },
  ];
}

export function ClientesTable({ columnas, clientes = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={clientes}
      loading={loading}
      rowKey="id_cliente"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
