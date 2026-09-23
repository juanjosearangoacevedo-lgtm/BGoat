import { Package2 } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { loteStatusOptions } from "../hooks/useLotesPage";
import { DesgloseTallaColor } from "./DesgloseTallaColor";
import { FichaTecnicaLote } from "./FichaTecnicaLote";

/**
 * Formulario de la tabla `lotes`.
 *
 * Es el unico formulario del producto: aqui esta lo que antes obligaba a
 * recorrer cinco pantallas (Pedidos, Referencias, Fichas Tecnicas,
 * Prendas y el propio Lote). Va en secciones para que se lea en el orden
 * en que llega la hoja del cliente: de quien es, que es, que acordamos,
 * cuanto y para cuando.
 *
 * La ficha y el desglose solo aparecen al editar: suben archivos y filas
 * hijas, y las dos cosas necesitan que el lote ya exista en la base.
 */
export function LoteFormModal({
  open,
  editing,
  form,
  errors,
  guardando,
  clienteOptions = [],
  tipoPrendaOptions = [],
  tallaOptions = [],
  colorOptions = [],
  subiendoFicha = false,
  desglose = [],
  guardandoDesglose = false,
  onSubirFicha,
  onQuitarFicha,
  onGuardarDesglose,
  onChange,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      icon={Package2}
      title={editing ? `Editar lote: ${editing.codigo_lote}` : "Nuevo lote"}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <ModalAcciones
          editing={editing}
          guardando={guardando}
          entidad="lote"
          onClose={onClose}
          onSave={onSave}
        />
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            De quien viene
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Codigo de lote"
              required
              autoFocus
              placeholder="LOT-0000"
              value={form.codigo_lote ?? ""}
              error={errors.codigo_lote}
              hint="No puede repetirse."
              onChange={(valor) => onChange("codigo_lote", valor)}
            />
            <FormField
              label="Cliente"
              required
              value={form.id_cliente ?? ""}
              options={clienteOptions}
              emptyOption="Seleccionar cliente"
              error={errors.id_cliente}
              onChange={(valor) => onChange("id_cliente", valor)}
            />
            <FormField
              label="Numero de pedido"
              placeholder="PED-2026-000"
              value={form.numero_pedido ?? ""}
              error={errors.numero_pedido}
              hint="El folio con el que el cliente lo pidio. Opcional."
              onChange={(valor) => onChange("numero_pedido", valor)}
            />
            <FormField
              label="Fecha del pedido"
              type="date"
              value={form.fecha_pedido ?? ""}
              error={errors.fecha_pedido}
              onChange={(valor) => onChange("fecha_pedido", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Que se va a confeccionar
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Codigo de referencia"
              placeholder="9703"
              value={form.codigo_referencia ?? ""}
              error={errors.codigo_referencia}
              hint="El codigo que trae la hoja del cliente."
              onChange={(valor) => onChange("codigo_referencia", valor)}
            />
            <FormField
              label="Nombre de la referencia"
              placeholder="Camiseta cuello redondo"
              value={form.nombre_referencia ?? ""}
              error={errors.nombre_referencia}
              onChange={(valor) => onChange("nombre_referencia", valor)}
            />
            <FormField
              label="Tipo de prenda"
              value={form.id_tipo_prenda ?? ""}
              options={tipoPrendaOptions}
              emptyOption="Sin clasificar"
              error={errors.id_tipo_prenda}
              onChange={(valor) => onChange("id_tipo_prenda", valor)}
            />
            <FormField
              label="Material principal"
              placeholder="Algodon 30/1"
              value={form.material_principal ?? ""}
              error={errors.material_principal}
              onChange={(valor) => onChange("material_principal", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Acuerdo con el cliente
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="SAM pactado (minutos por prenda)"
              type="number"
              step="0.01"
              min={0}
              placeholder="6.50"
              value={form.sam_pactado ?? ""}
              error={errors.sam_pactado}
              hint="Sin el SAM no se puede iniciar la jornada: es lo que fija la meta de cada hora."
              onChange={(valor) => onChange("sam_pactado", valor)}
            />
            <FormField
              label="Cantidad programada"
              type="number"
              min={0}
              placeholder="0"
              value={form.cantidad_programada ?? ""}
              error={errors.cantidad_programada}
              onChange={(valor) => onChange("cantidad_programada", valor)}
            />
            <FormField
              label="Entrega programada"
              type="date"
              value={form.fecha_entrega_programada ?? ""}
              error={errors.fecha_entrega_programada}
              onChange={(valor) => onChange("fecha_entrega_programada", valor)}
            />
            <FormField
              label="Entrega real"
              type="date"
              value={form.fecha_entrega_real ?? ""}
              error={errors.fecha_entrega_real}
              hint="Se llena cuando el lote sale."
              onChange={(valor) => onChange("fecha_entrega_real", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Recepcion y avance
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Fecha de recepcion"
              type="date"
              required
              value={form.fecha_recepcion ?? ""}
              error={errors.fecha_recepcion}
              onChange={(valor) => onChange("fecha_recepcion", valor)}
            />
            <FormField
              label="Cantidad recibida"
              type="number"
              min={0}
              placeholder="0"
              value={form.cantidad_recibida ?? ""}
              error={errors.cantidad_recibida}
              onChange={(valor) => onChange("cantidad_recibida", valor)}
            />
            <FormField
              label="Fecha de inicio"
              type="date"
              value={form.fecha_inicio ?? ""}
              error={errors.fecha_inicio}
              onChange={(valor) => onChange("fecha_inicio", valor)}
            />
            <FormField
              label="Fecha de finalizacion"
              type="date"
              value={form.fecha_finalizacion ?? ""}
              error={errors.fecha_finalizacion}
              onChange={(valor) => onChange("fecha_finalizacion", valor)}
            />
            <FormField
              label="Estado"
              required
              value={form.estado ?? "REGISTRADO"}
              options={loteStatusOptions}
              error={errors.estado}
              onChange={(valor) => onChange("estado", valor)}
            />
          </div>
        </section>

        {editing ? (
          <>
            <FichaTecnicaLote
              lote={editing}
              subiendo={subiendoFicha}
              onSubir={onSubirFicha}
              onQuitar={onQuitarFicha}
            />
            <DesgloseTallaColor
              lote={editing}
              desglose={desglose}
              tallaOptions={tallaOptions}
              colorOptions={colorOptions}
              guardando={guardandoDesglose}
              cantidadProgramada={form.cantidad_programada}
              onGuardar={onGuardarDesglose}
            />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
            La ficha tecnica y el desglose por talla y color se agregan despues de crear el lote,
            desde su detalle o volviendo a este formulario.
          </p>
        )}

        <FormField
          label="Observaciones"
          type="textarea"
          placeholder="Observaciones del lote"
          value={form.observaciones ?? ""}
          error={errors.observaciones}
          onChange={(valor) => onChange("observaciones", valor)}
        />
      </div>
    </Modal>
  );
}
