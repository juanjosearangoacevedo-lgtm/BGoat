import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { documento, formatFechaHora, iniciales, nombreCompleto } from "@/shared/utils/formatters";

/**
 * Columnas del listado de la tabla `usuarios`.
 * Las comparte la tabla, el modo lista y la exportacion a CSV.
 */
export function columnasUsuarios({ roleName, onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "nombres",
      header: "Usuario",
      sortable: true,
      sortValue: (usuario) => nombreCompleto(usuario),
      render: (usuario) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#433A9B] to-[#F39A3D] text-xs font-bold text-white">
            {iniciales(nombreCompleto(usuario))}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{nombreCompleto(usuario)}</p>
            <p className="truncate text-xs text-gray-400">{usuario.correo}</p>
          </div>
        </div>
      ),
      exportar: (usuario) => nombreCompleto(usuario),
    },
    {
      key: "numero_documento",
      header: "Documento",
      sortable: true,
      render: (usuario) => documento(usuario),
    },
    {
      key: "correo",
      header: "Correo",
      sortable: true,
      oculta: true,
      exportable: true,
    },
    {
      key: "telefono",
      header: "Telefono",
      sortable: true,
      render: (usuario) => usuario.telefono || <span className="text-gray-300">Sin telefono</span>,
      exportar: (usuario) => usuario.telefono || "",
    },
    {
      key: "id_rol",
      header: "Rol",
      sortable: true,
      sortValue: (usuario) => usuario.nombre_rol || roleName?.(usuario.id_rol) || "",
      render: (usuario) => usuario.nombre_rol || roleName?.(usuario.id_rol) || usuario.id_rol,
      exportar: (usuario) => usuario.nombre_rol || roleName?.(usuario.id_rol) || usuario.id_rol,
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (usuario) => <StatusBadge status={usuario.estado} />,
      exportar: (usuario) => usuario.estado,
    },
    {
      key: "ultimo_acceso",
      header: "Ultimo acceso",
      sortable: true,
      render: (usuario) => formatFechaHora(usuario.ultimo_acceso),
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (usuario) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({
            fila: usuario,
            onDetalle,
            onEdit,
            onToggleEstado,
            onDelete,
            activo: String(usuario.estado).toUpperCase() === "ACTIVO",
          })}
        />
      ),
    },
  ];
}

/** Listado de la tabla `usuarios` sobre la tabla generica del panel. */
export function UsuariosTable({ columnas, users = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={users}
      loading={loading}
      rowKey="id_usuario"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
