import { Check, Package2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { loteStatusOptions } from "../hooks/useLotesPage";

/** Formulario de la tabla `lotes`. */
export function LoteFormModal({
  open,
  editing,
  form,
  errors,
  guardando,
  marcaOptions = [],
  pedidoOptions = [],
  referenciaOptions = [],
  onChange,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      icon={Package2}
      title={editing ? `Editar lote: ${editing.codigo_lote}` : "Nuevo lote"}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
            onClick={onSave}
            disabled={guardando}
          >
            <Check className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : editing ? "Guardar cambios" : "Crear lote"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">
            Origen del lote
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Codigo de lote"
              required
              autoFocus
              placeholder="LOT-0000"
              value={form.codigo_lote ?? ""}
              error={errors.codigo_lote}
              hint="No puede repetirse."
              onChange={(valor) => onChange("codigo_lote", valor)}
            />
            <FormField
              label="Marca"
              required
              value={form.id_marca ?? ""}
              options={marcaOptions}
              emptyOption="Seleccionar marca"
              error={errors.id_marca}
              onChange={(valor) => onChange("id_marca", valor)}
            />
            <FormField
              label="Pedido"
              value={form.id_pedido ?? ""}
              options={pedidoOptions}
              emptyOption="Sin pedido"
              error={errors.id_pedido}
              onChange={(valor) => onChange("id_pedido", valor)}
            />
            <FormField
              label="Referencia"
              value={form.id_referencia ?? ""}
              options={referenciaOptions}
              emptyOption="Sin referencia"
              error={errors.id_referencia}
              onChange={(valor) => onChange("id_referencia", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">
            Cantidades y fechas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Cantidad programada"
              type="number"
              min={0}
              placeholder="0"
              value={form.cantidad_programada ?? ""}
              error={errors.cantidad_programada}
              onChange={(valor) => onChange("cantidad_programada", valor)}
            />
            <FormField
              label="Cantidad recibida"
              type="number"
              min={0}
              placeholder="0"
              value={form.cantidad_recibida ?? ""}
              error={errors.cantidad_recibida}
              onChange={(valor) => onChange("cantidad_recibida", valor)}
            />
            <FormField
              label="Fecha de recepcion"
              type="date"
              required
              value={form.fecha_recepcion ?? ""}
              error={errors.fecha_recepcion}
              onChange={(valor) => onChange("fecha_recepcion", valor)}
            />
            <FormField
              label="Estado"
              required
              value={form.estado ?? "REGISTRADO"}
              options={loteStatusOptions}
              error={errors.estado}
              onChange={(valor) => onChange("estado", valor)}
            />
            <FormField
              label="Fecha de inicio"
              type="date"
              value={form.fecha_inicio ?? ""}
              error={errors.fecha_inicio}
              onChange={(valor) => onChange("fecha_inicio", valor)}
            />
            <FormField
              label="Fecha de finalizacion"
              type="date"
              value={form.fecha_finalizacion ?? ""}
              error={errors.fecha_finalizacion}
              onChange={(valor) => onChange("fecha_finalizacion", valor)}
            />
          </div>
        </section>

        <FormField
          label="Observaciones"
          type="textarea"
          placeholder="Observaciones del lote"
          value={form.observaciones ?? ""}
          error={errors.observaciones}
          onChange={(valor) => onChange("observaciones", valor)}
        />
      </div>
    </Modal>
  );
}
