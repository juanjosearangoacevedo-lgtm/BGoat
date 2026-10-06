import { ArrowLeft, RefreshCcw, Save, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { FormField } from "@/shared/components/FormField";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatMoneda } from "@/shared/utils/formatters";
import { OrdenFormSection } from "../components/OrdenFormSection";
import { OrdenSelectField } from "../components/OrdenSelectField";
import { useOrdenForm } from "../hooks/useOrdenForm";

/**
 * Formulario de `ordenes_produccion`.
 *
 * Ya no pide ficha tecnica, pedido ni detalle por prenda: la ficha, el
 * SAM y el valor de maquila vienen dentro del lote, el pedido dejo de
 * existir y la produccion se mide por lote, no por talla y color.
 * Tampoco pide la cantidad programada: un lote corre en una sola orden,
 * asi que es la del lote (se ve en "Lo que trae el lote") y el backend
 * la copia al guardar. Tampoco pide el numero de orden: lo genera el
 * backend al crear (`OP-2026-0001`...), para que no se repita entre
 * quienes esten creando ordenes al mismo tiempo.
 *
 * Tampoco pide fechas, prioridad ni estado: las tres se calculan o se
 * asignan solas (ver `useOrdenForm.js`). Nada de esto se digita.
 */
export function OrdenFormPage({ onNavigate, orderData, isEdit = false }) {
  const {
    form,
    setField,
    errors,
    reset,
    estimacion,
    diasProgramados,
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
          {isEdit
            ? `Editar Orden ${orderData?.numero_orden ?? ""}`
            : "Nueva Orden de Produccion"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isEdit ? "Modifica los datos de la orden existente" : "Completa los datos para crear una nueva orden"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OrdenFormSection title="Informacion General">
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

        {/* El SAM, el valor de maquila y la referencia salen del lote: se
            muestran para confirmar que es el trabajo correcto, no para
            editarlos. */}
        {loteSeleccionado && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
            <p className="mb-3 text-sm font-medium text-gray-700">Lo que trae el lote</p>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-5">
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
                <p className="text-xs text-gray-500">Valor de maquila</p>
                <p
                  className={`font-medium ${loteSeleccionado.valor_maquila_unidad ? "text-gray-900" : "text-red-600"}`}
                >
                  {loteSeleccionado.valor_maquila_unidad
                    ? formatMoneda(loteSeleccionado.valor_maquila_unidad)
                    : "Falta"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cantidad programada</p>
                <p className="font-medium text-gray-900">{loteSeleccionado.cantidad_programada}</p>
              </div>
            </div>
          </div>
        )}

        {loteSeleccionado && (
          <OrdenFormSection title="Fechas" columns="md:grid-cols-3">
            {/* No se escogen ni se adivinan (`backend/src/lib/plan.js`): el
                inicio es el dia en que un modulo abre jornada con la orden, y
                la entrega sale de la formula de German desde ese dia, fija. */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Inicio</p>
              <p className="flex h-10 items-center text-lg font-bold text-gray-800">
                {orderData?.fecha_inicio_real
                  ? formatFecha(orderData.fecha_inicio_real)
                  : "Al iniciar jornada"}
              </p>
              <p className="text-xs text-gray-400">
                El dia en que un modulo abra jornada con esta orden.
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Entrega</p>
              <p className="flex h-10 items-center text-lg font-bold text-[#0F4C3F]">
                {orderData?.fecha_fin_programada
                  ? formatFecha(orderData.fecha_fin_programada)
                  : "Al iniciar jornada"}
              </p>
              <p className="text-xs text-gray-400">
                {form.eficiencia_esperada
                  ? "Formula de German desde el inicio. Queda fija como entrega del lote."
                  : "Falta la eficiencia esperada, abajo: sin ella no hay fecha."}
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Duracion estimada</p>
              <p className="flex h-10 items-center text-lg font-bold text-gray-800">
                {diasProgramados ? `${diasProgramados} dia${diasProgramados === 1 ? "" : "s"}` : "—"}
              </p>
            </div>
          </OrdenFormSection>
        )}

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
            <div className="grid grid-cols-3 gap-4 text-sm">
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
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Al 100% de eficiencia, con el SAM del lote y los minutos reales de la jornada de
              planta. Que modulo la tome se decide despues, al abrir la jornada.
            </p>

            <div className="mt-4 border-t border-[#0F4C3F]/10 pt-4">
              <div className="w-48">
                <FormField
                  label="Eficiencia esperada (%)"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="65"
                  value={form.eficiencia_esperada}
                  error={errors.eficiencia_esperada}
                  hint="Segun experiencia del modulo. Se puede ajustar dia a dia."
                  onChange={(valor) => setField("eficiencia_esperada", valor)}
                />
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Con esto se calcula la duracion, contando dia por dia y saltando domingos y
                festivos (de la pantalla "Dias no laborales"). Al iniciar jornada se calcula la
                entrega con las personas de esa jornada. Si la orden ya inicio, cambiar la
                eficiencia recalcula la entrega desde el mismo inicio (decision de German).
              </p>
            </div>
          </div>
        )}

        <OrdenFormSection title="Configuracion" columns="md:grid-cols-2">
          {isEdit && orderData?.prioridad ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Prioridad</p>
              <div className="flex h-10 items-center gap-2">
                <span className="rounded-full bg-[#0F4C3F]/10 px-3 py-1 text-sm font-semibold text-[#0F4C3F]">
                  #{orderData.prioridad}
                </span>
                <span className="text-xs text-gray-400">en la cola global, no se edita</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Prioridad</p>
              <p className="flex h-10 items-center text-xs text-gray-400">
                Se asigna sola al guardar: la orden mas vieja va primero.
              </p>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Estado</p>
            <div className="flex h-10 items-center gap-2">
              <StatusBadge status={orderData?.estado || "PENDIENTE"} />
              <span className="text-xs text-gray-400">
                {orderData?.estado === "FINALIZADO"
                  ? "Se completo solo al alcanzar la cantidad programada."
                  : orderData?.estado === "EN_PROCESO"
                    ? "Un modulo ya la tomo."
                    : "Pasa solo a En proceso cuando un modulo la tome."}
              </span>
            </div>
          </div>
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
