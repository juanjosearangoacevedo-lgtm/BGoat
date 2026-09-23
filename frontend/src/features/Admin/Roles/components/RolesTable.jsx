import { Shield } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la tabla `roles`.
 *
 * Se exportan aparte porque las usan la tabla, el modo lista y la exportacion
 * a CSV: asi el archivo sale con las mismas columnas que se ven en pantalla.
 * `total_permisos` y `usuarios_activos` los calcula el backend.
 */
export function columnasRoles({ onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "nombre",
      header: "Rol",
      sortable: true,
      render: (rol) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0F4C3F]/10 text-[#0F4C3F]">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-medium text-gray-900">{rol.nombre}</span>
        </div>
      ),
      exportar: (rol) => rol.nombre,
    },
    {
      key: "descripcion",
      header: "Descripcion",
      sortable: true,
      render: (rol) => (
        <span className={rol.descripcion ? "" : "text-gray-300"}>
          {rol.descripcion || "Sin descripcion"}
        </span>
      ),
      exportar: (rol) => rol.descripcion || "",
    },
    {
      key: "total_permisos",
      header: "Permisos",
      align: "center",
      sortable: true,
      render: (rol) => {
        const total = Number(rol.total_permisos || 0);
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              total > 0 ? "bg-[#0F4C3F]/10 text-[#0F4C3F]" : "bg-amber-50 text-amber-600"
            }`}
          >
            {total > 0 ? `${total} permisos` : "Sin permisos"}
          </span>
        );
      },
      exportar: (rol) => Number(rol.total_permisos || 0),
    },
    {
      key: "usuarios_activos",
      header: "Usuarios",
      align: "center",
      sortable: true,
      render: (rol) => Number(rol.usuarios_activos || 0),
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (rol) => <StatusBadge status={rol.estado} />,
      exportar: (rol) => rol.estado,
    },
    {
      key: "fecha_creacion",
      header: "Creado",
      sortable: true,
      render: (rol) => formatFecha(rol.fecha_creacion),
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (rol) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: rol, onDetalle, onEdit, onToggleEstado, onDelete })}
        />
      ),
    },
  ];
}

/** Listado de la tabla `roles` sobre la tabla generica del panel. */
export function RolesTable({ columnas, roles = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={roles}
      loading={loading}
      rowKey="id_rol"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
