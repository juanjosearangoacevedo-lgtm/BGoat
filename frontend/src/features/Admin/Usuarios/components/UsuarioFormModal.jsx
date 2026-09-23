import { UserCog } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { nombreCompleto } from "@/shared/utils/formatters";
import { usuarioDocumentTypes, usuarioStatusOptions } from "../hooks/useUsuariosPage";

/** Campos de la tabla `usuarios` (sin `clave_hash`: el hash lo hace el backend). */
export function UsuarioFormModal({
  open,
  editing,
  form,
  errors,
  guardando,
  roleOptions = [],
  onChange,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      icon={UserCog}
      title={editing ? `Editar usuario: ${nombreCompleto(editing)}` : "Nuevo usuario"}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <ModalAcciones
          editing={editing}
          guardando={guardando}
          entidad="usuario"
          onClose={onClose}
          onSave={onSave}
        />
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Datos personales
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Nombres"
              required
              autoFocus
              placeholder="Nombres del usuario"
              value={form.nombres ?? ""}
              error={errors.nombres}
              onChange={(valor) => onChange("nombres", valor)}
            />
            <FormField
              label="Apellidos"
              required
              placeholder="Apellidos del usuario"
              value={form.apellidos ?? ""}
              error={errors.apellidos}
              onChange={(valor) => onChange("apellidos", valor)}
            />
            <FormField
              label="Tipo de documento"
              required
              value={form.tipo_documento ?? "CC"}
              options={usuarioDocumentTypes}
              error={errors.tipo_documento}
              onChange={(valor) => onChange("tipo_documento", valor)}
            />
            <FormField
              label="Numero de documento"
              required
              placeholder="1234567890"
              value={form.numero_documento ?? ""}
              error={errors.numero_documento}
              hint={form.tipo_documento === "PASAPORTE" ? "Admite letras y numeros" : "Solo numeros"}
              onChange={(valor) => onChange("numero_documento", valor)}
            />
            <FormField
              label="Correo"
              type="email"
              required
              placeholder="usuario@empresa.com"
              value={form.correo ?? ""}
              error={errors.correo}
              hint="Con este correo inicia sesion."
              onChange={(valor) => onChange("correo", valor)}
            />
            <FormField
              label="Telefono"
              type="tel"
              placeholder="300 000 0000"
              value={form.telefono ?? ""}
              error={errors.telefono}
              onChange={(valor) => onChange("telefono", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Acceso al sistema
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Rol"
              required
              value={form.id_rol ?? ""}
              options={roleOptions}
              emptyOption="Seleccionar rol"
              error={errors.id_rol}
              hint="El rol define que modulos ve el usuario."
              onChange={(valor) => onChange("id_rol", valor)}
            />
            <FormField
              label="Estado"
              required
              value={form.estado ?? "ACTIVO"}
              options={usuarioStatusOptions}
              error={errors.estado}
              onChange={(valor) => onChange("estado", valor)}
            />
            <FormField
              label="Contrasena"
              type="password"
              required={!editing}
              placeholder={editing ? "Dejar vacio para no cambiarla" : "Minimo 8 caracteres"}
              value={form.clave ?? ""}
              error={errors.clave}
              hint={
                editing
                  ? "Solo se cambia si escribes una nueva."
                  : "Minimo 8 caracteres, con al menos una letra y un numero."
              }
              onChange={(valor) => onChange("clave", valor)}
            />
            <FormField
              label="Confirmar contrasena"
              type="password"
              required={!editing}
              placeholder="Repite la contrasena"
              value={form.confirmar_clave ?? ""}
              error={errors.confirmar_clave}
              hint="Debe coincidir con la contrasena."
              onChange={(valor) => onChange("confirmar_clave", valor)}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
