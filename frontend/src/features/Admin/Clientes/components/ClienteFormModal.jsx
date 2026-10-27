import { Building2 } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { useUbicaciones } from "@/shared/hooks/useUbicaciones";
import { ejemploDocumento, normalizarDocumento, pistaDocumento } from "@/shared/validations";
import { clienteDocumentTypes, clienteStatusOptions } from "../hooks/useClientesPage";

/**
 * Campos de la tabla `clientes`.
 *
 * El orden es el de todo el panel: nombre, documento, contacto, direccion,
 * estado y, al final, la descripcion. "Nombre o razon social" es UN solo
 * campo (la marca, la empresa o la persona, como la planta la conoce) y es
 * lo unico obligatorio: cuando llega un lote a media manana, la digitadora
 * registra el cliente con lo que trae la hoja y sigue; el NIT lo completa
 * despues quien lo tenga.
 *
 * Departamento y municipio se escogen de la lista de Colombia (el municipio
 * depende del departamento); la direccion es solo la calle.
 */
export function ClienteFormModal({
  open,
  editing,
  form,
  errors,
  guardando,
  onChange,
  onBlur,
  onClose,
  onSave,
}) {
  const ubicaciones = useUbicaciones({ activo: open, departamento: form.departamento });
  const tipo = form.tipo_documento ?? "NIT";

  return (
    <Modal
      open={open}
      icon={Building2}
      title={editing ? `Editar cliente: ${editing?.nombre}` : "Nuevo cliente"}
      description="Solo el nombre o la razón social es obligatorio. El resto se puede completar después."
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="Nombre o razón social"
            required
            autoFocus
            placeholder="GEF o Crystal S.A.S."
            value={form.nombre ?? ""}
            error={errors.nombre}
            hint="Como se conoce en la planta: la marca, la empresa o la persona."
            onChange={(valor) => onChange("nombre", valor)}
            onBlur={() => onBlur?.("nombre")}
          />
        </div>

        <FormField
          label="Tipo de documento"
          value={tipo}
          options={clienteDocumentTypes}
          error={errors.tipo_documento}
          // Lo que no cabe en el tipo nuevo (letras en una cédula) se quita del número.
          onChange={(valor) => {
            onChange("tipo_documento", valor);
            onChange("numero_documento", normalizarDocumento(valor, form.numero_documento ?? ""));
          }}
        />
        <FormField
          label="Número de documento"
          placeholder={ejemploDocumento(tipo)}
          value={form.numero_documento ?? ""}
          error={errors.numero_documento}
          hint={pistaDocumento(tipo, form.numero_documento)}
          onChange={(valor) => onChange("numero_documento", normalizarDocumento(tipo, valor))}
          onBlur={() => onBlur?.("numero_documento")}
        />

        <FormField
          label="Correo"
          type="email"
          placeholder="compras@empresa.com"
          value={form.correo ?? ""}
          error={errors.correo}
          onChange={(valor) => onChange("correo", valor)}
          onBlur={() => onBlur?.("correo")}
        />
        <FormField
          label="Teléfono"
          type="tel"
          placeholder="300 000 0000"
          value={form.telefono ?? ""}
          error={errors.telefono}
          onChange={(valor) => onChange("telefono", valor)}
          onBlur={() => onBlur?.("telefono")}
        />

        <FormField
          label="Departamento"
          value={form.departamento ?? ""}
          options={ubicaciones.departamentos}
          emptyOption={ubicaciones.cargando ? "Cargando..." : "Elige el departamento"}
          disabled={ubicaciones.departamentos.length === 0}
          error={errors.departamento}
          hint={ubicaciones.error ? "No se pudo cargar la lista de departamentos." : undefined}
          // Cambiar de departamento deja sin efecto el municipio que se había elegido.
          onChange={(valor) => {
            onChange("departamento", valor);
            onChange("municipio", "");
          }}
        />
        <FormField
          label="Municipio"
          value={form.municipio ?? ""}
          options={ubicaciones.municipios}
          emptyOption={form.departamento ? "Elige el municipio" : "Elige primero el departamento"}
          disabled={!form.departamento || ubicaciones.municipios.length === 0}
          error={errors.municipio}
          onChange={(valor) => onChange("municipio", valor)}
        />
        <div className="sm:col-span-2">
          <FormField
            label="Dirección"
            placeholder="Calle 00 # 00-00"
            value={form.direccion ?? ""}
            error={errors.direccion}
            hint="Solo la calle o la carrera: el departamento y el municipio ya van arriba."
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
        <div className="sm:col-span-2">
          <FormField
            label="Descripción"
            type="textarea"
            rows={2}
            placeholder="Ropa interior y básicos"
            value={form.descripcion ?? ""}
            error={errors.descripcion}
            onChange={(valor) => onChange("descripcion", valor)}
          />
        </div>
      </div>
    </Modal>
  );
}
