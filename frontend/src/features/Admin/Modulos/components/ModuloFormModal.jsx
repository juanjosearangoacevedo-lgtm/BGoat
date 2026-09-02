import { Check, Factory } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { moduloStatusOptions } from "../hooks/useModulosPage";

/** Formulario de la tabla `modulos`. */
export function ModuloFormModal({ open, editing, form, errors, guardando, onChange, onClose, onSave }) {
  return (
    <Modal
      open={open}
      icon={Factory}
      title={editing ? `Editar modulo: ${editing.codigo}` : "Nuevo modulo"}
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
            {guardando ? "Guardando..." : editing ? "Guardar cambios" : "Crear modulo"}
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
              label="Codigo"
              required
              autoFocus
              placeholder="MOD-01"
              value={form.codigo ?? ""}
              error={errors.codigo}
              hint="No puede repetirse."
              onChange={(valor) => onChange("codigo", valor)}
            />
            <FormField
              label="Nombre"
              required
              placeholder="Modulo 01"
              value={form.nombre ?? ""}
              error={errors.nombre}
              onChange={(valor) => onChange("nombre", valor)}
            />
            <FormField
              label="Ubicacion"
              placeholder="Seccion A"
              value={form.ubicacion ?? ""}
              error={errors.ubicacion}
              hint="Agrupa los modulos en el tablero."
              onChange={(valor) => onChange("ubicacion", valor)}
            />
            <FormField
              label="Estado"
              required
              value={form.estado ?? "ACTIVO"}
              options={moduloStatusOptions}
              error={errors.estado}
              onChange={(valor) => onChange("estado", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">
            Capacidad y metas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Capacidad de operarios"
              type="number"
              min={0}
              max={200}
              placeholder="12"
              value={form.capacidad_operarios ?? ""}
              error={errors.capacidad_operarios}
              onChange={(valor) => onChange("capacidad_operarios", valor)}
            />
            <FormField
              label="Orden en el tablero"
              type="number"
              min={1}
              max={99}
              placeholder="1"
              value={form.orden_visual ?? ""}
              error={errors.orden_visual}
              onChange={(valor) => onChange("orden_visual", valor)}
            />
            <FormField
              label="Horas de jornada"
              type="number"
              min={1}
              max={24}
              placeholder="9"
              value={form.horas_jornada ?? ""}
              error={errors.horas_jornada}
              hint="Define el alto de la rejilla de captura."
              onChange={(valor) => onChange("horas_jornada", valor)}
            />
            <FormField
              label="Horas semanales"
              type="number"
              min={1}
              max={168}
              placeholder="44"
              value={form.horas_semanales ?? ""}
              error={errors.horas_semanales}
              onChange={(valor) => onChange("horas_semanales", valor)}
            />
            <FormField
              label="Eficiencia esperada (%)"
              type="number"
              min={1}
              max={200}
              placeholder="80"
              value={form.eficiencia_esperada ?? ""}
              error={errors.eficiencia_esperada}
              onChange={(valor) => onChange("eficiencia_esperada", valor)}
            />
            <FormField
              label="Umbral de cumplimiento (%)"
              type="number"
              min={1}
              max={100}
              placeholder="85"
              value={form.umbral_cumplimiento ?? ""}
              error={errors.umbral_cumplimiento}
              hint="Por debajo del umbral se pide la causa."
              onChange={(valor) => onChange("umbral_cumplimiento", valor)}
            />
          </div>
        </section>

        <FormField
          label="Observaciones"
          type="textarea"
          placeholder="Observaciones del modulo"
          value={form.observaciones ?? ""}
          error={errors.observaciones}
          onChange={(valor) => onChange("observaciones", valor)}
        />
      </div>
    </Modal>
  );
}
