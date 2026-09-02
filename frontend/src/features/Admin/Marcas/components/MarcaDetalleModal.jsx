import { Tag } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { formatFecha } from "@/shared/utils/formatters";

/** Detalle de un registro de la tabla `marcas`. */
export function MarcaDetalleModal({ marca, onClose, onEditar }) {
  const secciones = marca
    ? [
        {
          titulo: "Datos de la marca",
          filas: [
            { label: "Nombre", value: marca.nombre },
            { label: "Registrada el", value: formatFecha(marca.fecha_creacion) },
            { label: "Descripcion", value: marca.descripcion, ancho: "completo" },
          ],
        },
      ]
    : [];

  return (
    <DetailModal
      open={Boolean(marca)}
      icon={Tag}
      title={marca?.nombre || ""}
      subtitle="Marca"
      estado={marca?.estado}
      secciones={secciones}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
            onClick={() => onEditar?.(marca)}
          >
            Editar marca
          </Button>
        </>
      }
    />
  );
}
