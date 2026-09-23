import { AlertTriangle, FileImage, Package2 } from "lucide-react";
import { archivoUrl } from "@/shared/services/apiClient";
import { formatFecha, formatMoneda, formatNumero } from "@/shared/utils/formatters";

/**
 * Paso 4: para quien y que lote.
 *
 * Cliente primero, lote despues, y los lotes filtrados por el cliente:
 * ofrecer todos los lotes de la planta en una sola lista es la forma mas
 * facil de arrancar una jornada con el lote de otro cliente.
 *
 * Al elegir el lote se muestra la ficha tecnica que vino con el. Es la
 * confirmacion visual de que es el trabajo correcto: la digitadora
 * reconoce la prenda antes de leer el codigo.
 */
export function PasoTrabajo({
  clientes = [],
  lotes = [],
  ordenes = [],
  form,
  errors = {},
  onCambiar,
  loteSeleccionado,
  ordenSeleccionada,
}) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <Package2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="font-medium text-gray-600">No hay lotes disponibles para producir</p>
        <p className="mt-1 text-sm text-gray-400">
          Registra el lote que llego del cliente en Planta &gt; Lotes y vuelve aqui.
        </p>
      </div>
    );
  }

  // Se muestra la foto, no el PDF: la digitadora reconoce la prenda de un
  // vistazo, y abrir un PDF a mitad del asistente la saca de la pantalla.
  const ficha = archivoUrl(loteSeleccionado?.ruta_imagen);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="jornada-cliente" className="mb-2 block text-sm font-medium text-gray-700">
          Cliente
        </label>
        <select
          id="jornada-cliente"
          value={form.id_cliente}
          onChange={(evento) => onCambiar("id_cliente", evento.target.value)}
          className={`h-12 w-full rounded-xl border bg-white px-3 text-base outline-none focus:border-[#0F4C3F] ${
            errors.id_cliente ? "border-red-400" : "border-gray-200"
          }`}
        >
          <option value="">Seleccionar cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id_cliente} value={cliente.id_cliente}>
              {cliente.nombre} ({cliente.lotes_disponibles}{" "}
              {Number(cliente.lotes_disponibles) === 1 ? "lote" : "lotes"})
            </option>
          ))}
        </select>
        {errors.id_cliente && <p className="mt-1 text-sm text-red-600">{errors.id_cliente}</p>}
      </div>

      <div>
        <label htmlFor="jornada-lote" className="mb-2 block text-sm font-medium text-gray-700">
          Lote
        </label>
        <select
          id="jornada-lote"
          value={form.id_lote}
          disabled={!form.id_cliente}
          onChange={(evento) => onCambiar("id_lote", evento.target.value)}
          className={`h-12 w-full rounded-xl border bg-white px-3 text-base outline-none focus:border-[#0F4C3F] disabled:bg-gray-50 disabled:text-gray-400 ${
            errors.id_lote ? "border-red-400" : "border-gray-200"
          }`}
        >
          <option value="">
            {form.id_cliente ? "Seleccionar lote" : "Escoge primero el cliente"}
          </option>
          {lotes.map((lote) => (
            <option key={lote.id_lote} value={lote.id_lote}>
              {lote.codigo_lote}
              {lote.codigo_referencia ? ` - ${lote.codigo_referencia}` : ""}
            </option>
          ))}
        </select>
        {errors.id_lote && <p className="mt-1 text-sm text-red-600">{errors.id_lote}</p>}
      </div>

      {/* La orden. Solo se pregunta cuando hay mas de una disponible:
          con una sola, escoger entre una no decide nada y ya viene
          puesta. Las que otro modulo ya tomo no llegan hasta aqui. */}
      {form.id_lote && ordenes.length > 1 && (
        <div>
          <label
            htmlFor="jornada-orden"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Orden de produccion
          </label>
          <select
            id="jornada-orden"
            value={form.id_orden_produccion}
            onChange={(evento) => onCambiar("id_orden_produccion", evento.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base outline-none focus:border-[#0F4C3F]"
          >
            <option value="">Seleccionar orden</option>
            {ordenes.map((orden) => (
              <option key={orden.id_orden_produccion} value={orden.id_orden_produccion}>
                {orden.numero_orden} - {formatNumero(orden.cantidad_programada)} und
                {orden.prioridad === "URGENTE" || orden.prioridad === "ALTA"
                  ? ` (${orden.prioridad.toLowerCase()})`
                  : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Al iniciar, este modulo toma la orden y ningun otro podra cogerla.
          </p>
        </div>
      )}

      {loteSeleccionado && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {ficha ? (
              <a
                href={ficha}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 self-start"
                title="Abrir la ficha tecnica"
              >
                <img
                  src={ficha}
                  alt={`Ficha tecnica del lote ${loteSeleccionado.codigo_lote}`}
                  className="h-28 w-28 rounded-xl border border-gray-200 bg-white object-cover"
                />
              </a>
            ) : (
              <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 self-start rounded-xl border border-dashed border-gray-300 bg-white text-gray-300">
                <FileImage className="h-6 w-6" />
                <span className="text-[10px]">Sin ficha</span>
              </div>
            )}

            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="col-span-2">
                <dt className="text-xs text-gray-500">Referencia</dt>
                <dd className="truncate font-medium text-gray-900">
                  {loteSeleccionado.nombre_referencia || loteSeleccionado.codigo_referencia || "Sin referencia"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">SAM pactado</dt>
                <dd className="font-semibold text-[#0F4C3F]">
                  {loteSeleccionado.sam_pactado
                    ? `${loteSeleccionado.sam_pactado} min`
                    : "Sin SAM"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Cantidad</dt>
                <dd className="font-medium text-gray-900">
                  {formatNumero(loteSeleccionado.cantidad_programada)}
                </dd>
              </div>
              {loteSeleccionado.fecha_entrega_programada && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500">Entrega</dt>
                  <dd className="font-medium text-gray-900">
                    {formatFecha(loteSeleccionado.fecha_entrega_programada)}
                  </dd>
                </div>
              )}
              {ordenSeleccionada && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500">Orden que va a tomar</dt>
                  <dd className="font-medium text-gray-900">
                    {ordenSeleccionada.numero_orden}
                    {ordenSeleccionada.valor_maquila_unidad
                      ? ` · ${formatMoneda(ordenSeleccionada.valor_maquila_unidad)} / und`
                      : ""}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Sin SAM no hay meta, y sin meta la hora capturada no se puede
              comparar con nada. Se avisa aqui y no al guardar la primera hora. */}
          {!loteSeleccionado.sam_pactado && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Este lote no tiene SAM pactado. Sin el no se puede calcular la meta de la hora:
              completalo en Planta &gt; Lotes antes de iniciar.
            </p>
          )}

          {/* Sin orden la jornada arranca igual: la meta sale del SAM del
              lote. Lo que queda en cero es la plata, porque el valor de
              maquila es lo unico que aporta la orden. */}
          {ordenes.length === 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-gray-100 p-3 text-sm text-gray-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              No hay ordenes libres para este lote. La jornada arranca igual y la meta se calcula,
              pero la facturacion queda en cero hasta que exista una orden.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
