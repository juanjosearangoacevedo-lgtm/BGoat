import { Check, Minus } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";

/**
 * Matriz de consulta de la tabla `permisos`.
 *
 * Una fila por permiso (modulo + accion) y una columna por rol: la casilla
 * marcada es un registro de `rol_permiso`. Es solo lectura; para cambiarla se
 * entra al formulario del rol, que es donde vive la edicion.
 */
function Marca({ concedido }) {
  return concedido ? (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-[#0F4C3F] text-white">
      <Check className="h-3.5 w-3.5 stroke-[3]" />
    </span>
  ) : (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-300">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

export function columnasPermisos({ roles = [], tiene }) {
  return [
    {
      key: "modulo",
      header: "Modulo",
      sortable: true,
      render: (permiso) => <span className="font-medium text-gray-800">{permiso.modulo}</span>,
      exportar: (permiso) => permiso.modulo,
    },
    {
      key: "etiquetaAccion",
      header: "Accion",
      sortable: true,
    },
    ...roles.map((rol) => ({
      key: `rol-${rol.id_rol}`,
      header: rol.nombre,
      align: "center",
      sortable: false,
      headerClassName: "whitespace-nowrap",
      render: (permiso) => <Marca concedido={tiene(rol.id_rol, permiso.id_permiso)} />,
      exportar: (permiso) => (tiene(rol.id_rol, permiso.id_permiso) ? "Si" : "No"),
    })),
    {
      key: "totalRoles",
      header: "Roles",
      align: "center",
      sortable: true,
      render: (permiso) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            permiso.totalRoles > 0 ? "bg-[#0F4C3F]/10 text-[#0F4C3F]" : "bg-gray-100 text-gray-400"
          }`}
        >
          {permiso.totalRoles}
        </span>
      ),
      exportar: (permiso) => permiso.totalRoles,
    },
  ];
}

export function PermisosMatrix({ columnas, filas = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={filas}
      loading={loading}
      rowKey="id_permiso"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
