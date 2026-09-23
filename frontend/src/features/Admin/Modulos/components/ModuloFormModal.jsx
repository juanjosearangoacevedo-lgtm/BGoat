import { Factory } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
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
        <ModalAcciones
          editing={editing}
          guardando={guardando}
          entidad="modulo"
          onClose={onClose}
          onSave={onSave}
        />
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
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
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Capacidad y regla de alerta
          </h3>

          {/* Aqui se pedian tambien las horas de jornada, las horas
              semanales y la eficiencia esperada. Las tres eran resultados
              disfrazados de campo: las horas del dia las dan las franjas
              (520 minutos entre semana, 440 el sabado) y la eficiencia se
              mide contra la meta. Escritas a mano solo contradecian al
              numero que el sistema calcula. */}
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
