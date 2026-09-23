import { User } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { documento, formatFecha, formatFechaHora, nombreCompleto } from "@/shared/utils/formatters";

/** Detalle de un registro de la tabla `usuarios`. */
export function UsuarioDetalleModal({ usuario, roleName, onClose, onEditar }) {
  const secciones = usuario
    ? [
        {
          titulo: "Datos personales",
          filas: [
            { label: "Nombres", value: usuario.nombres },
            { label: "Apellidos", value: usuario.apellidos },
            { label: "Documento", value: documento(usuario) },
            { label: "Telefono", value: usuario.telefono },
            { label: "Correo", value: usuario.correo, ancho: "completo" },
          ],
        },
        {
          titulo: "Acceso al sistema",
          filas: [
            { label: "Rol", value: usuario.nombre_rol || roleName?.(usuario.id_rol) },
            { label: "Ultimo acceso", value: formatFechaHora(usuario.ultimo_acceso) },
            { label: "Intentos fallidos", value: Number(usuario.intentos_fallidos || 0) },
            {
              label: "Bloqueado hasta",
              value: usuario.bloqueado_hasta ? formatFechaHora(usuario.bloqueado_hasta) : null,
            },
            { label: "Registrado el", value: formatFecha(usuario.fecha_creacion) },
          ],
        },
      ]
    : [];

  return (
    <DetailModal
      open={Boolean(usuario)}
      icon={User}
      title={nombreCompleto(usuario)}
      subtitle="Usuario del sistema"
      estado={usuario?.estado}
      secciones={secciones}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
            onClick={() => onEditar?.(usuario)}
          >
            Editar usuario
          </Button>
        </>
      }
    />
  );
}
