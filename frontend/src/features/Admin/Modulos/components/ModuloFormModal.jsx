import { Factory } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { moduloStatusOptions } from "../hooks/useModulosPage";

/**
 * Formulario de la tabla `modulos`.
 *
 * El codigo (MOD-01, MOD-02...) no se digita: lo asigna el sistema al crear y
 * ya no cambia (al editar, va en el titulo). Tampoco se pide la ubicacion.
 */
export function ModuloFormModal({ open, editing, form, errors, guardando, onChange, onClose, onSave }) {
  return (
    <Modal
      open={open}
      icon={Factory}
      title={editing ? `Editar módulo: ${editing.codigo}` : "Nuevo módulo"}
      description={
        editing
          ? "Los campos marcados con * son obligatorios."
          : "El código (MOD-01, MOD-02…) lo asigna el sistema al guardar. Los campos marcados con * son obligatorios."
      }
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <ModalAcciones
          editing={editing}
          guardando={guardando}
          entidad="modulo"
          onClose={onClose}
          onSave={onSave}
        />
      }
    >
      {/* Aqui se pedian tambien las horas de jornada, las horas semanales y la
          eficiencia esperada. Las tres eran resultados disfrazados de campo:
          las horas del dia las dan las franjas (520 minutos entre semana, 440
          el sabado) y la eficiencia se mide contra la meta. Escritas a mano
          solo contradecian al numero que el sistema calcula. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="Nombre"
            required
            autoFocus
            placeholder="Módulo 01"
            value={form.nombre ?? ""}
            error={errors.nombre}
            onChange={(valor) => onChange("nombre", valor)}
          />
        </div>

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
          label="Umbral de cumplimiento (%)"
          type="number"
          min={1}
          max={100}
          placeholder="85"
          value={form.umbral_cumplimiento ?? ""}
          error={errors.umbral_cumplimiento}
          hint="Por debajo del umbral se pide la incidencia."
          onChange={(valor) => onChange("umbral_cumplimiento", valor)}
        />
        <FormField
          label="Orden en el tablero"
          type="number"
          min={1}
          max={99}
          placeholder="Al final"
          value={form.orden_visual ?? ""}
          error={errors.orden_visual}
          hint="Opcional: si lo dejas vacío, el módulo queda al final."
          onChange={(valor) => onChange("orden_visual", valor)}
        />
        {/* El estado va al final, antes de las observaciones, como en todo el panel. */}
        <FormField
          label="Estado"
          required
          value={form.estado ?? "ACTIVO"}
          options={moduloStatusOptions}
          error={errors.estado}
          onChange={(valor) => onChange("estado", valor)}
        />

        <div className="sm:col-span-2">
          <FormField
            label="Observaciones"
            type="textarea"
            placeholder="Observaciones del módulo"
            value={form.observaciones ?? ""}
            error={errors.observaciones}
            onChange={(valor) => onChange("observaciones", valor)}
          />
        </div>
      </div>
    </Modal>
  );
}
