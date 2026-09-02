import { Check, Tag } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { marcaStatusOptions } from "../hooks/useMarcasPage";

/** Campos de la tabla `marcas`. */
export function MarcaFormModal({ open, editing, form, errors, guardando, onChange, onClose, onSave }) {
  return (
    <Modal
      open={open}
      icon={Tag}
      title={editing ? `Editar marca: ${editing.nombre}` : "Nueva marca"}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      maxWidth="max-w-lg"
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
            {guardando ? "Guardando..." : editing ? "Guardar cambios" : "Crear marca"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Nombre de la marca"
          required
          autoFocus
          placeholder="Nombre comercial"
          value={form.nombre ?? ""}
          error={errors.nombre}
          hint="Entre 2 y 60 caracteres. No puede repetirse."
          onChange={(valor) => onChange("nombre", valor)}
        />

        <FormField
          label="Descripcion"
          type="textarea"
          rows={3}
          placeholder="Que produce esta marca"
          value={form.descripcion ?? ""}
          error={errors.descripcion}
          onChange={(valor) => onChange("descripcion", valor)}
        />

        <FormField
          label="Estado"
          required
          value={form.estado ?? "ACTIVO"}
          options={marcaStatusOptions}
          error={errors.estado}
          onChange={(valor) => onChange("estado", valor)}
        />
      </div>
    </Modal>
  );
}
