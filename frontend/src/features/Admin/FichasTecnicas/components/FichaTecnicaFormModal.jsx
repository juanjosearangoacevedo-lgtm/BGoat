import { Check, Shirt } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { fichaStatusOptions } from "../hooks/useFichasTecnicasPage";

/** Formulario de la tabla `fichas_tecnicas`. */
export function FichaTecnicaFormModal({
  open,
  editing,
  form,
  errors,
  referenciaOptions = [],
  guardando = false,
  onChange,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      icon={Shirt}
      title={editing ? `Editar ficha: ${editing.codigo_ficha}` : "Nueva ficha tecnica"}
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
            disabled={guardando}
            onClick={onSave}
          >
            <Check className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : editing ? "Guardar cambios" : "Crear ficha"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">
            Identificacion
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Referencia"
              required
              value={form.id_referencia ?? ""}
              options={referenciaOptions}
              emptyOption="Seleccionar referencia"
              error={errors.id_referencia}
              onChange={(valor) => onChange("id_referencia", valor)}
            />
            <FormField
              label="Codigo de ficha"
              required
              autoFocus
              placeholder="FT-001"
              value={form.codigo_ficha ?? ""}
              error={errors.codigo_ficha}
              onChange={(valor) => onChange("codigo_ficha", valor)}
            />
            <FormField
              label="Version"
              required
              placeholder="1.0"
              value={form.version ?? "1.0"}
              error={errors.version}
              hint="El mismo codigo puede tener varias versiones."
              onChange={(valor) => onChange("version", valor)}
            />
            <FormField
              label="Estado"
              required
              value={form.estado ?? "BORRADOR"}
              options={fichaStatusOptions}
              error={errors.estado}
              onChange={(valor) => onChange("estado", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">
            Tiempos y materiales
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="SAM pactado (min por unidad)"
              type="number"
              min={0}
              step="0.01"
              placeholder="25"
              value={form.sam_pactado ?? ""}
              error={errors.sam_pactado}
              hint="Sin SAM el sistema no puede calcular la meta horaria."
              onChange={(valor) => onChange("sam_pactado", valor)}
            />
            <FormField
              label="Personal requerido"
              type="number"
              min={0}
              placeholder="4"
              value={form.personal_requerido ?? ""}
              error={errors.personal_requerido}
              onChange={(valor) => onChange("personal_requerido", valor)}
            />
            <FormField
              label="Material principal"
              placeholder="Algodon 100%"
              value={form.material_principal ?? ""}
              error={errors.material_principal}
              onChange={(valor) => onChange("material_principal", valor)}
            />
            <FormField
              label="Fecha de vigencia"
              type="date"
              value={form.fecha_vigencia ?? ""}
              error={errors.fecha_vigencia}
              onChange={(valor) => onChange("fecha_vigencia", valor)}
            />
            <div className="sm:col-span-2">
              <FormField
                label="Descripcion"
                type="textarea"
                placeholder="Descripcion tecnica de la referencia"
                value={form.descripcion ?? ""}
                error={errors.descripcion}
                onChange={(valor) => onChange("descripcion", valor)}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">Adjuntos</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Ruta de imagen"
              placeholder="/uploads/ficha-tecnica.jpg"
              value={form.ruta_imagen ?? ""}
              error={errors.ruta_imagen}
              onChange={(valor) => onChange("ruta_imagen", valor)}
            />
            <FormField
              label="Ruta PDF"
              placeholder="/uploads/ficha-tecnica.pdf"
              value={form.ruta_documento_pdf ?? ""}
              error={errors.ruta_documento_pdf}
              onChange={(valor) => onChange("ruta_documento_pdf", valor)}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
