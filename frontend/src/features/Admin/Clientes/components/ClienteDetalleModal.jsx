import { Building2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { documento, formatFecha } from "@/shared/utils/formatters";

/** Detalle de un registro de la tabla `clientes`. */
export function ClienteDetalleModal({ cliente, onClose, onEditar }) {
  const secciones = cliente
    ? [
        {
          titulo: "Identificación",
          filas: [
            { label: "Nombre o razón social", value: cliente.nombre, ancho: "completo" },
            { label: "Documento", value: documento(cliente) },
            { label: "Registrado el", value: formatFecha(cliente.fecha_creacion) },
          ],
        },
        {
          titulo: "Contacto",
          filas: [
            { label: "Correo", value: cliente.correo },
            { label: "Teléfono", value: cliente.telefono },
            { label: "Departamento", value: cliente.departamento },
            { label: "Municipio", value: cliente.municipio },
            { label: "Dirección", value: cliente.direccion, ancho: "completo" },
          ],
        },
        {
          titulo: "Notas",
          filas: [{ label: "Descripción", value: cliente.descripcion, ancho: "completo" }],
        },
      ]
    : [];

  return (
    <DetailModal
      open={Boolean(cliente)}
      icon={Building2}
      title={cliente?.nombre}
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
            className="flex-1 bg-dorado text-white hover:bg-dorado-hover"
            onClick={() => onEditar?.(cliente)}
          >
            Editar cliente
          </Button>
        </>
      }
    />
  );
}
