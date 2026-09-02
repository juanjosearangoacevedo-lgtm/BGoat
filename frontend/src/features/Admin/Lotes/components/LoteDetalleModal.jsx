import { Package2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { formatFecha, formatNumero, porcentaje } from "@/shared/utils/formatters";

/** Detalle de un registro de la tabla `lotes`. */
export function LoteDetalleModal({ lote, nombreMarca, onClose, onEditar }) {
  const avance = lote ? porcentaje(lote.cantidad_recibida, lote.cantidad_programada) : 0;

  const secciones = lote
    ? [
        {
          titulo: "Origen del lote",
          filas: [
            { label: "Codigo del lote", value: lote.codigo_lote },
            { label: "Marca", value: lote.nombre_marca || nombreMarca?.(lote.id_marca) },
            { label: "Pedido", value: lote.numero_pedido },
            { label: "Referencia", value: lote.codigo_referencia },
          ],
        },
        {
          titulo: "Cantidades",
          filas: [
            { label: "Programada", value: formatNumero(lote.cantidad_programada) },
            { label: "Recibida", value: formatNumero(lote.cantidad_recibida) },
            {
              label: "Recibido sobre lo programado",
              ancho: "completo",
              value: (
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#433A9B] transition-all"
                      style={{ width: `${avance}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{avance}%</span>
                </div>
              ),
            },
          ],
        },
        {
          titulo: "Fechas y notas",
          filas: [
            { label: "Recepcion", value: formatFecha(lote.fecha_recepcion) },
            { label: "Inicio", value: formatFecha(lote.fecha_inicio) },
            { label: "Finalizacion", value: formatFecha(lote.fecha_finalizacion) },
            { label: "Observaciones", value: lote.observaciones, ancho: "completo" },
          ],
        },
      ]
    : [];

  return (
    <DetailModal
      open={Boolean(lote)}
      icon={Package2}
      title={lote?.codigo_lote || ""}
      subtitle="Lote de produccion"
      estado={lote?.estado}
      secciones={secciones}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
            onClick={() => onEditar?.(lote)}
          >
            Editar lote
          </Button>
        </>
      }
    />
  );
}
