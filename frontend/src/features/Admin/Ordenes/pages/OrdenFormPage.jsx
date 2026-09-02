import { ArrowLeft, RefreshCcw, Save, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { OrdenDetalleLineas } from "../components/OrdenDetalleLineas";
import { OrdenFormSection } from "../components/OrdenFormSection";
import { OrdenSelectField } from "../components/OrdenSelectField";
import { useOrdenForm } from "../hooks/useOrdenForm";
import { ordenPrioridadOptions, ordenStatusOptions } from "../hooks/useOrdenesPage";

/** Formulario de `ordenes_produccion` + `detalle_orden_produccion`. */
export function OrdenFormPage({ onNavigate, orderData, isEdit = false }) {
  const {
    form,
    setField,
    errors,
    errorDetalle,
    reset,
    detalle,
    addLinea,
    updateLinea,
    removeLinea,
    totalDetalle,
    estimacion,
    guardando,
    guardar,
    loteOptions,
    moduloOptions,
    fichaOptions,
    pedidoOptions,
    prendaOptions,
  } = useOrdenForm({ orderData });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await guardar(isEdit);
    if (ok) onNavigate?.("orders");
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => onNavigate?.("orders")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Ordenes
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? "Editar Orden de Produccion" : "Nueva Orden de Produccion"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isEdit ? "Modifica los datos de la orden existente" : "Completa los datos para crear una nueva orden"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OrdenFormSection title="Informacion General">
          <FormField
            label="Numero de orden"
            required
            placeholder="OP-0000"
            value={form.numero_orden}
            error={errors.numero_orden}
            onChange={(valor) => setField("numero_orden", valor)}
          />
          <OrdenSelectField
            label="Pedido"
            placeholder="Sin pedido asociado"
            value={form.id_pedido}
            onChange={(value) => setField("id_pedido", value)}
            options={pedidoOptions}
            error={errors.id_pedido}
            required={false}
          />
          <OrdenSelectField
            label="Lote"
            placeholder="Seleccionar lote"
            value={form.id_lote}
            onChange={(value) => setField("id_lote", value)}
            options={loteOptions}
            error={errors.id_lote}
            required={true}
          />
          <OrdenSelectField
            label="Modulo"
            placeholder="Seleccionar modulo"
            value={form.id_modulo}
            onChange={(value) => setField("id_modulo", value)}
            options={moduloOptions}
            error={errors.id_modulo}
            required={true}
          />
          <OrdenSelectField
            label="Ficha tecnica"
            placeholder="Seleccionar ficha tecnica"
            value={form.id_ficha_tecnica}
            onChange={(value) => setField("id_ficha_tecnica", value)}
            options={fichaOptions}
            error={errors.id_ficha_tecnica}
            required={true}
          />
        </OrdenFormSection>

        <OrdenFormSection title="Produccion" columns="md:grid-cols-3">
          <FormField
            label="Cantidad programada"
            type="number"
            min={1}
            required
            placeholder="0"
            value={form.cantidad_programada}
            error={errors.cantidad_programada}
            onChange={(valor) => setField("cantidad_programada", valor)}
          />
          <FormField
            label="Fecha de inicio programada"
            type="date"
            value={form.fecha_inicio_programada}
            error={errors.fecha_inicio_programada}
            onChange={(valor) => setField("fecha_inicio_programada", valor)}
          />
          <FormField
            label="Fecha de fin programada"
            type="date"
            value={form.fecha_fin_programada}
            error={errors.fecha_fin_programada}
            onChange={(valor) => setField("fecha_fin_programada", valor)}
          />
        </OrdenFormSection>

        <OrdenDetalleLineas
          detalle={detalle}
          prendaOptions={prendaOptions}
          cantidadProgramada={form.cantidad_programada}
          total={totalDetalle}
          onAdd={addLinea}
          onUpdate={updateLinea}
          onRemove={removeLinea}
          error={errorDetalle}
        />

        {estimacion && (
          <div className="rounded-2xl border border-[#433A9B]/20 bg-[#433A9B]/5 p-5">
            <p className="mb-2 text-sm font-medium text-[#433A9B]">Capacidad estimada</p>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">SAM pactado</p>
                <p className="text-lg font-bold text-gray-800">{estimacion.sam} min</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unidades por hora</p>
                <p className="text-lg font-bold text-gray-800">{estimacion.unidadesPorHora}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unidades por dia</p>
                <p className="text-lg font-bold text-gray-800">{estimacion.unidadesPorDia}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dias estimados</p>
                <p className="text-lg font-bold text-[#433A9B]">{estimacion.diasEstimados}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Calculado con la capacidad del modulo y el SAM de la ficha. Sirve para comprometer la
              fecha de entrega con un dato y no con una intuicion.
            </p>
          </div>
        )}

        <OrdenFormSection title="Configuracion" columns="md:grid-cols-2">
          <OrdenSelectField
            label="Prioridad"
            required
            placeholder="Seleccionar prioridad"
            value={form.prioridad}
            onChange={(value) => setField("prioridad", value)}
            options={ordenPrioridadOptions}
          />
          <OrdenSelectField
            label="Estado"
            required
            placeholder="Seleccionar estado"
            value={form.estado}
            onChange={(value) => setField("estado", value)}
            options={ordenStatusOptions}
          />
          <FormField
            label="Valor de maquila por unidad"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={form.valor_maquila_unidad}
            error={errors.valor_maquila_unidad}
            onChange={(valor) => setField("valor_maquila_unidad", valor)}
          />
          <div className="md:col-span-2">
            <FormField
              label="Observaciones"
              type="textarea"
              rows={2}
              placeholder="Observaciones de la orden"
              value={form.observaciones}
              error={errors.observaciones}
              onChange={(valor) => setField("observaciones", valor)}
            />
          </div>
        </OrdenFormSection>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onNavigate?.("orders")}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
          <Button type="submit" disabled={guardando} className="bg-[#433A9B] hover:bg-[#433A9B]/90">
            <Save className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
