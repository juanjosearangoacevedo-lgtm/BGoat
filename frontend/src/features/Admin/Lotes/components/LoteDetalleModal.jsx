import { Package2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { DetailModal } from "@/shared/components/DetailModal";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatFechaHora, formatMoneda, formatNumero } from "@/shared/utils/formatters";
import { DesgloseTallaColor } from "./DesgloseTallaColor";
import { FichaTecnicaLote } from "./FichaTecnicaLote";

/**
 * Detalle de un registro de la tabla `lotes`: TODOS sus campos. El
 * listado muestra solo cinco columnas, el resto se consulta aqui.
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
  tallaOptions = [],
  colorOptions = [],
  onSubirFicha,
  onQuitarFicha,
  onGuardarDesglose,
  onClose,
  onEditar,
}) {
  const secciones = lote
    ? [
        {
          titulo: "Origen del lote",
          filas: [
            { label: "Codigo del lote", value: lote.codigo_lote },
            { label: "Numero de pedido", value: lote.numero_pedido },
            { label: "Cliente", value: lote.nombre_cliente || nombreCliente?.(lote.id_cliente) },
          ],
        },
        {
          titulo: "Que se confecciona",
          filas: [
            { label: "Referencia", value: lote.codigo_referencia },
            { label: "Nombre de la referencia", value: lote.nombre_referencia },
            { label: "Tipo de prenda", value: lote.nombre_tipo_prenda },
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
            {
              label: "Valor de maquila",
              value: Number(lote.valor_maquila_unidad)
                ? `${formatMoneda(lote.valor_maquila_unidad)} / unidad`
                : null,
            },
            {
              label: "Entrega programada",
              value: lote.fecha_entrega_programada
                ? formatFecha(lote.fecha_entrega_programada)
                : "Se calcula cuando su orden inicia jornada",
            },
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
                  filas={desglose}
                  tallaOptions={tallaOptions}
                  colorOptions={colorOptions}
                  onChange={(filas) => onGuardarDesglose?.(lote.id_lote, filas)}
                />
              ),
            },
          ],
        },
        {
          titulo: "Cantidad",
          filas: [
            {
              // Es la suma del desglose de arriba: lo que llego a la planta.
              label: "Cantidad recibida",
              value: `${formatNumero(lote.cantidad_recibida)} prendas`,
            },
          ],
        },
        {
          titulo: "Fechas y notas",
          filas: [
            { label: "Recepcion", value: formatFecha(lote.fecha_recepcion) },
            { label: "Estado", value: <StatusBadge status={lote.estado} /> },
            {
              label: "Activo",
              value: Number(lote.activo ?? 1) ? "Si, se sigue ofreciendo" : "No, apagado",
            },
            {
              label: "Registrado en el sistema",
              value: lote.fecha_creacion ? formatFechaHora(lote.fecha_creacion) : null,
            },
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
            className="flex-1 bg-dorado text-white hover:bg-dorado-hover"
            onClick={() => onEditar?.(lote)}
          >
            Editar lote
          </Button>
        </>
      }
    />
  );
}
