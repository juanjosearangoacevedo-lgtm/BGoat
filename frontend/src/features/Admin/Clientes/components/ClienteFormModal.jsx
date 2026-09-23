import { Building2 } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { clienteDocumentTypes, clienteStatusOptions } from "../hooks/useClientesPage";

/**
 * Campos de la tabla `clientes` (el cliente-marca unificado).
 *
 * El formulario esta partido en dos secciones con una intencion: arriba
 * queda lo minimo para poder trabajar --el nombre-- y abajo los datos
 * fiscales, que son opcionales. Cuando llega un lote a media manana, la
 * digitadora registra el cliente con el nombre que trae la hoja y sigue;
 * el NIT lo completa despues quien lo tenga.
 */
export function ClienteFormModal({ open, editing, form, errors, guardando, onChange, onClose, onSave }) {
  return (
    <Modal
      open={open}
      icon={Building2}
      title={editing ? `Editar cliente: ${editing?.nombre}` : "Nuevo cliente"}
      description="Solo el nombre es obligatorio. Los datos fiscales se pueden completar despues."
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <ModalAcciones
          editing={editing}
          guardando={guardando}
          entidad="cliente"
          onClose={onClose}
          onSave={onSave}
        />
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Como lo conoce la planta
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                label="Nombre"
                required
                autoFocus
                placeholder="GEF"
                value={form.nombre ?? ""}
                error={errors.nombre}
                hint="El nombre con el que se pide el lote: casi siempre la marca."
                onChange={(valor) => onChange("nombre", valor)}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                label="Descripcion"
                placeholder="Ropa interior y basicos"
                value={form.descripcion ?? ""}
                error={errors.descripcion}
                onChange={(valor) => onChange("descripcion", valor)}
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

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Datos fiscales (opcionales)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                label="Razon social"
                placeholder="Crystal S.A.S."
                value={form.razon_social ?? ""}
                error={errors.razon_social}
                hint="La empresa que factura. Varias marcas pueden compartirla."
                onChange={(valor) => onChange("razon_social", valor)}
              />
            </div>
            <FormField
              label="Tipo de documento"
              value={form.tipo_documento ?? "NIT"}
              options={clienteDocumentTypes}
              error={errors.tipo_documento}
              onChange={(valor) => onChange("tipo_documento", valor)}
            />
            <FormField
              label="Numero de documento"
              placeholder="900000000-0"
              value={form.numero_documento ?? ""}
              error={errors.numero_documento}
              onChange={(valor) => onChange("numero_documento", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">Contacto</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Correo"
              type="email"
              placeholder="compras@empresa.com"
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
          </div>
        </section>
      </div>
    </Modal>
  );
}
