import { ArrowLeft, RefreshCcw, Save, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { OrdenFormSection } from "../components/OrdenFormSection";
import { OrdenSelectField } from "../components/OrdenSelectField";
import { useOrdenForm } from "../hooks/useOrdenForm";
import { ordenPrioridadOptions, ordenStatusOptions } from "../hooks/useOrdenesPage";

/**
 * Formulario de `ordenes_produccion`.
 *
 * Ya no pide ficha tecnica, pedido ni detalle por prenda: la ficha y el
 * SAM vienen dentro del lote, el pedido dejo de existir y la produccion
 * se mide por lote, no por talla y color.
 */
export function OrdenFormPage({ onNavigate, orderData, isEdit = false }) {
  const {
    form,
    setField,
    errors,
    reset,
    estimacion,
    guardando,
    guardar,
    loteSeleccionado,
    loteOptions,
    personasSupuestas,
    setPersonasSupuestas,
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
            label="Lote"
            placeholder="Seleccionar lote"
            value={form.id_lote}
            onChange={(value) => setField("id_lote", value)}
            options={loteOptions}
            error={errors.id_lote}
            required={true}
          />
        </OrdenFormSection>

        {/* El SAM y la referencia salen del lote: se muestran para
            confirmar que es el trabajo correcto, no para editarlos. */}
        {loteSeleccionado && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
            <p className="mb-3 text-sm font-medium text-gray-700">Lo que trae el lote</p>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-medium text-gray-900">{loteSeleccionado.nombre_cliente}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Referencia</p>
                <p className="font-medium text-gray-900">
                  {loteSeleccionado.codigo_referencia || "Sin referencia"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">SAM pactado</p>
                <p className={`font-medium ${loteSeleccionado.sam_pactado ? "text-gray-900" : "text-red-600"}`}>
                  {loteSeleccionado.sam_pactado ? `${loteSeleccionado.sam_pactado} min` : "Falta"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cantidad del lote</p>
                <p className="font-medium text-gray-900">{loteSeleccionado.cantidad_programada}</p>
              </div>
            </div>
          </div>
        )}

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

        {estimacion && (
          <div className="rounded-2xl border border-[#0F4C3F]/20 bg-[#0F4C3F]/5 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#0F4C3F]">Capacidad estimada</p>

              {/* La orden ya no nombra modulo, asi que las personas son un
                  supuesto de quien la programa, no un dato de la orden. Se
                  deja editable y se dice que es un supuesto. */}
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Si la toma un modulo de
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={personasSupuestas}
                  onChange={(evento) => setPersonasSupuestas(evento.target.value)}
                  className="h-8 w-16 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm outline-none focus:border-[#0F4C3F]"
                />
                operarias
              </label>
            </div>
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
                <p className="text-xs text-gray-500">Unidades por dia ({estimacion.horasDia} h)</p>
                <p className="text-lg font-bold text-gray-800">{estimacion.unidadesPorDia}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dias estimados</p>
                <p className="text-lg font-bold text-[#0F4C3F]">{estimacion.diasEstimados}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Calculado con el SAM del lote y los minutos reales de la jornada de planta. Sirve
              para comprometer la fecha de entrega con un dato y no con una intuicion. Que modulo
              la tome se decide despues, al abrir la jornada.
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
          <Button type="submit" disabled={guardando} className="bg-[#D08E10] hover:bg-[#B67F14]">
            <Save className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
