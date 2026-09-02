import { Building2, Check } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { nombreCliente } from "@/shared/utils/formatters";
import { clienteDocumentTypes, clienteStatusOptions } from "../hooks/useClientesPage";

/** Campos de la tabla `clientes`: empresa (razon social) o persona natural. */
export function ClienteFormModal({ open, editing, form, errors, guardando, onChange, onClose, onSave }) {
  return (
    <Modal
      open={open}
      icon={Building2}
      title={editing ? `Editar cliente: ${nombreCliente(editing)}` : "Nuevo cliente"}
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
            {guardando ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}
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
              label="Tipo de documento"
              required
              value={form.tipo_documento ?? "NIT"}
              options={clienteDocumentTypes}
              error={errors.tipo_documento}
              onChange={(valor) => onChange("tipo_documento", valor)}
            />
            <FormField
              label="Numero de documento"
              required
              autoFocus
              placeholder="900000000-0"
              value={form.numero_documento ?? ""}
              error={errors.numero_documento}
              onChange={(valor) => onChange("numero_documento", valor)}
            />
            <div className="sm:col-span-2">
              <FormField
                label="Razon social"
                placeholder="Nombre de la empresa"
                value={form.razon_social ?? ""}
                error={errors.razon_social}
                hint="Si el cliente es una persona, deja este campo vacio y llena nombres y apellidos."
                onChange={(valor) => onChange("razon_social", valor)}
              />
            </div>
            <FormField
              label="Nombres"
              placeholder="Nombres"
              value={form.nombres ?? ""}
              error={errors.nombres}
              onChange={(valor) => onChange("nombres", valor)}
            />
            <FormField
              label="Apellidos"
              placeholder="Apellidos"
              value={form.apellidos ?? ""}
              error={errors.apellidos}
              onChange={(valor) => onChange("apellidos", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#433A9B]">Contacto</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Correo"
              type="email"
              placeholder="cliente@empresa.com"
              value={form.correo ?? ""}
              error={errors.correo}
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
            <div className="sm:col-span-2">
              <FormField
                label="Direccion"
                placeholder="Calle 00 # 00-00"
                value={form.direccion ?? ""}
                error={errors.direccion}
                onChange={(valor) => onChange("direccion", valor)}
              />
            </div>
            <FormField
              label="Estado"
              required
              value={form.estado ?? "ACTIVO"}
              options={clienteStatusOptions}
              error={errors.estado}
              onChange={(valor) => onChange("estado", valor)}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
