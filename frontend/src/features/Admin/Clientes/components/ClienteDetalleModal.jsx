import { Building2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { documento, formatFecha, nombreCliente } from "@/shared/utils/formatters";

/** Detalle de un registro de la tabla `clientes`. */
export function ClienteDetalleModal({ cliente, onClose, onEditar }) {
  const secciones = cliente
    ? [
        {
          titulo: "Identificacion",
          filas: [
            { label: "Tipo de cliente", value: cliente.razon_social ? "Empresa" : "Persona" },
            { label: "Documento", value: documento(cliente) },
            { label: "Razon social", value: cliente.razon_social, ancho: "completo" },
            { label: "Nombres", value: cliente.nombres },
            { label: "Apellidos", value: cliente.apellidos },
          ],
        },
        {
          titulo: "Contacto",
          filas: [
            { label: "Correo", value: cliente.correo },
            { label: "Telefono", value: cliente.telefono },
            { label: "Direccion", value: cliente.direccion, ancho: "completo" },
            { label: "Registrado el", value: formatFecha(cliente.fecha_creacion) },
          ],
        },
      ]
    : [];

  return (
    <DetailModal
      open={Boolean(cliente)}
      icon={Building2}
      title={nombreCliente(cliente)}
      subtitle="Cliente"
      estado={cliente?.estado}
      secciones={secciones}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
            onClick={() => onEditar?.(cliente)}
          >
            Editar cliente
          </Button>
        </>
      }
    />
  );
}
