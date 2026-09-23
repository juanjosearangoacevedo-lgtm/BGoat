import { useMemo } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { formatFecha } from "@/shared/utils/formatters";
import { accionLabels } from "@/shared/hooks/usePermisosCatalogo";

/**
 * Detalle de un rol: sus datos y los permisos que tiene concedidos,
 * agrupados por modulo igual que en el formulario.
 */
function PermisosPorModulo({ permisos = [] }) {
  const grupos = useMemo(() => {
    const porModulo = new Map();
    permisos.forEach((permiso) => {
      const modulo = permiso.modulo || "General";
      if (!porModulo.has(modulo)) porModulo.set(modulo, []);
      porModulo.get(modulo).push(accionLabels[permiso.accion] || permiso.accion);
    });
    return Array.from(porModulo.entries()).sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [permisos]);

  if (grupos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        Este rol no tiene permisos asignados: quien lo tenga no vera ningun modulo del panel.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {grupos.map(([modulo, acciones]) => (
        <div key={modulo} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <span className="min-w-32 text-sm font-medium text-gray-800">{modulo}</span>
          {acciones.map((accion) => (
            <span
              key={accion}
              className="rounded-full bg-[#0F4C3F]/10 px-2 py-0.5 text-xs font-medium text-[#0F4C3F]"
            >
              {accion}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function RolDetalleModal({ rol, permisos = [], onClose, onEditar }) {
  const secciones = rol
    ? [
        {
          titulo: "Datos del rol",
          filas: [
            { label: "Nombre", value: rol.nombre },
            { label: "Creado", value: formatFecha(rol.fecha_creacion) },
            { label: "Descripcion", value: rol.descripcion, ancho: "completo" },
            { label: "Usuarios activos", value: Number(rol.usuarios_activos || 0) },
            { label: "Permisos asignados", value: Number(rol.total_permisos || 0) },
          ],
        },
        {
          titulo: "Permisos concedidos",
          filas: [
            {
              label: "Por modulo",
              ancho: "completo",
              value: <PermisosPorModulo permisos={permisos} />,
            },
          ],
        },
      ]
    : [];

  return (
    <DetailModal
      open={Boolean(rol)}
      icon={Shield}
      title={rol?.nombre || ""}
      subtitle="Rol del sistema"
      estado={rol?.estado}
      secciones={secciones}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
            onClick={() => onEditar?.(rol)}
          >
            Editar rol y permisos
          </Button>
        </>
      }
    />
  );
}
