import { Package2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { formatFecha, formatNumero, porcentaje } from "@/shared/utils/formatters";
import { DesgloseTallaColor } from "./DesgloseTallaColor";
import { FichaTecnicaLote } from "./FichaTecnicaLote";

/**
 * Detalle de un registro de la tabla `lotes`.
 *
 * Es tambien donde se sube la ficha tecnica: el detalle es el sitio al que
 * se llega cuando alguien trae el papel y hay que adjuntarlo, sin tener
 * que abrir el formulario completo de edicion.
 */
export function LoteDetalleModal({
  lote,
  nombreCliente,
  subiendoFicha = false,
  desglose = [],
  guardandoDesglose = false,
  tallaOptions = [],
  colorOptions = [],
  onSubirFicha,
  onQuitarFicha,
  onGuardarDesglose,
  onClose,
  onEditar,
}) {
  const avance = lote ? porcentaje(lote.cantidad_recibida, lote.cantidad_programada) : 0;

  const secciones = lote
    ? [
        {
          titulo: "Origen del lote",
          filas: [
            { label: "Codigo del lote", value: lote.codigo_lote },
            { label: "Numero de pedido", value: lote.numero_pedido },
            { label: "Cliente", value: lote.nombre_cliente || nombreCliente?.(lote.id_cliente) },
            { label: "Fecha del pedido", value: formatFecha(lote.fecha_pedido) },
          ],
        },
        {
          titulo: "Que se confecciona",
          filas: [
            { label: "Referencia", value: lote.codigo_referencia },
            { label: "Nombre de la referencia", value: lote.nombre_referencia },
            { label: "Tipo de prenda", value: lote.nombre_tipo_prenda },
            { label: "Material principal", value: lote.material_principal },
          ],
        },
        {
          titulo: "Acuerdo con el cliente",
          filas: [
            {
              label: "SAM pactado",
              value: Number(lote.sam_pactado)
                ? `${lote.sam_pactado} minutos por prenda`
                : "Sin SAM: no se puede iniciar la jornada",
            },
            { label: "Entrega programada", value: formatFecha(lote.fecha_entrega_programada) },
            { label: "Entrega real", value: formatFecha(lote.fecha_entrega_real) },
          ],
        },
        {
          titulo: "Ficha tecnica",
          filas: [
            {
              label: "",
              ancho: "completo",
              value: (
                <FichaTecnicaLote
                  lote={lote}
                  compacto
                  subiendo={subiendoFicha}
                  onSubir={onSubirFicha}
                  onQuitar={onQuitarFicha}
                />
              ),
            },
          ],
        },
        {
          titulo: "Desglose por talla y color",
          filas: [
            {
              label: "",
              ancho: "completo",
              value: (
                <DesgloseTallaColor
                  lote={lote}
                  desglose={desglose}
                  tallaOptions={tallaOptions}
                  colorOptions={colorOptions}
                  guardando={guardandoDesglose}
                  cantidadProgramada={lote.cantidad_programada}
                  onGuardar={onGuardarDesglose}
                />
              ),
            },
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
                      className="h-full rounded-full bg-[#0F4C3F] transition-all"
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
            className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
            onClick={() => onEditar?.(lote)}
          >
            Editar lote
          </Button>
        </>
      }
    />
  );
}
