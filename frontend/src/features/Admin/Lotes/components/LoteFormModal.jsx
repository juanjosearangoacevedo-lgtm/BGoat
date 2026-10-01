import { useState } from "react";
import { Calculator, Package2 } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { CalculadoraSamModal } from "./CalculadoraSamModal";
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
 * La ficha se puede cargar desde el primer momento: los archivos se
 * guardan en memoria y se suben apenas el lote se crea. El desglose por
 * talla y color si solo aparece al editar, porque son filas hijas que
 * necesitan que el lote ya exista en la base.
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
  archivosPendientes,
  desglose = [],
  guardandoDesglose = false,
  onSubirFicha,
  onQuitarFicha,
  onSeleccionarArchivoPendiente,
  onQuitarArchivoPendiente,
  onGuardarDesglose,
  onChange,
  onClose,
  onSave,
}) {
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);

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
              autoFocus
              placeholder="LOT-0000"
              value={form.codigo_lote ?? ""}
              error={errors.codigo_lote}
              hint="Si lo dejas vacio pero hay referencia, se genera uno solo."
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
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Acuerdo con el cliente
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label>SAM (acuerdo con el cliente)</Label>
                <button
                  type="button"
                  onClick={() => setMostrarCalculadora(true)}
                  className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Calcular
                </button>
              </div>
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="6.50"
                value={form.sam_pactado ?? ""}
                onChange={(event) => onChange("sam_pactado", event.target.value)}
                className={errors.sam_pactado ? "border-red-400 focus-visible:ring-red-300" : ""}
              />
              <p className={`text-xs ${errors.sam_pactado ? "text-red-500" : "text-gray-400"}`}>
                {errors.sam_pactado ??
                  "Sin el SAM no se puede iniciar la jornada: es lo que fija la meta de cada hora."}
              </p>
            </div>
            <FormField
              label="Valor de maquila por unidad"
              required
              type="number"
              step="0.01"
              min={0}
              placeholder="2600"
              value={form.valor_maquila_unidad ?? ""}
              error={errors.valor_maquila_unidad}
              hint="Lo que paga el cliente por prenda. Con el SAM arma la meta de facturacion de cada hora."
              onChange={(valor) => onChange("valor_maquila_unidad", valor)}
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
              hint="El compromiso con el cliente: cuando debe estar terminada la produccion."
              onChange={(valor) => onChange("fecha_entrega_programada", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
            Recepcion
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Fecha de recepcion"
              type="date"
              required
              value={form.fecha_recepcion ?? ""}
              error={errors.fecha_recepcion}
              hint="Cuando llego la mercancia a la planta -- no cuando se empieza a producir."
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
          </div>
        </section>

        <FichaTecnicaLote
          lote={editing}
          subiendo={subiendoFicha}
          onSubir={onSubirFicha}
          onQuitar={onQuitarFicha}
          pendientes={editing ? undefined : archivosPendientes}
          onSeleccionarPendiente={onSeleccionarArchivoPendiente}
          onQuitarPendiente={onQuitarArchivoPendiente}
        />

        {editing ? (
          <DesgloseTallaColor
            lote={editing}
            desglose={desglose}
            tallaOptions={tallaOptions}
            colorOptions={colorOptions}
            guardando={guardandoDesglose}
            cantidadProgramada={form.cantidad_programada}
            onGuardar={onGuardarDesglose}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
            El desglose por talla y color se agrega despues de crear el lote, desde su detalle o
            volviendo a este formulario.
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

      <CalculadoraSamModal
        open={mostrarCalculadora}
        precioInicial={form.valor_maquila_unidad}
        onClose={() => setMostrarCalculadora(false)}
        onUsar={(sam) => {
          onChange("sam_pactado", sam);
          setMostrarCalculadora(false);
        }}
      />
    </Modal>
  );
}
