import { Check, Shield } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { RolPermisosSelector } from "./RolPermisosSelector";
import { rolEstados } from "../validations/rolValidation";

/**
 * Formulario unico de rol: datos del rol y sus permisos en la misma ventana.
 *
 * Antes el nombre se creaba aqui y los permisos se asignaban en otra pantalla,
 * asi que un rol recien creado quedaba sin permisos hasta que alguien se
 * acordaba de ir a completarlo. Ahora se guarda todo junto.
 */
const estadoOptions = rolEstados.map((estado) => ({
  value: estado,
  label: estado === "ACTIVO" ? "Activo" : "Inactivo",
}));

export function RolFormModal({
  open,
  editing,
  form,
  errors,
  guardando,
  catalogo,
  seleccionados,
  cargandoPermisos,
  onChange,
  onTogglePermiso,
  onToggleModulo,
  onToggleTodos,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      icon={Shield}
      title={editing ? `Editar rol: ${editing.nombre}` : "Nuevo rol"}
      description="Define el rol y marca lo que puede hacer en cada modulo."
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
            onClick={onSave}
            disabled={guardando || cargandoPermisos}
          >
            <Check className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : editing ? "Guardar cambios" : "Crear rol"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <FormField
              label="Nombre del rol"
              placeholder="Supervisor de planta"
              required
              autoFocus
              value={form.nombre ?? ""}
              error={errors.nombre}
              hint="Entre 3 y 60 caracteres. No puede repetirse."
              onChange={(valor) => onChange("nombre", valor)}
            />
          </div>

          <FormField
            label="Estado"
            required
            value={form.estado ?? "ACTIVO"}
            options={estadoOptions}
            error={errors.estado}
            onChange={(valor) => onChange("estado", valor)}
          />
        </div>

        <FormField
          label="Descripcion"
          type="textarea"
          rows={2}
          placeholder="Que hace este rol dentro de la planta"
          value={form.descripcion ?? ""}
          error={errors.descripcion}
          hint="Opcional. Ayuda a saber a quien se le asigna."
          onChange={(valor) => onChange("descripcion", valor)}
        />

        <RolPermisosSelector
          grupos={catalogo.grupos}
          total={catalogo.total}
          seleccionados={seleccionados}
          cargando={catalogo.cargando || cargandoPermisos}
          error={catalogo.error}
          onTogglePermiso={onTogglePermiso}
          onToggleModulo={onToggleModulo}
          onToggleTodos={onToggleTodos}
        />
      </div>
    </Modal>
  );
}
