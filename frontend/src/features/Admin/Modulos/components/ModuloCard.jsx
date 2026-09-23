import { Factory } from "lucide-react";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatMoneda, formatNumero } from "@/shared/utils/formatters";

/**
 * Tarjeta de un registro de `modulos` con su cierre del dia.
 *
 * Mostraba una rejilla de puestos ocupados que se llenaba de
 * `modulo.operarios`, un campo que ningun endpoint devuelve desde que
 * `asignaciones_modulo` dejo de existir: salian los doce circulos vacios
 * siempre. En su lugar van las cifras del tablero, que si llegan.
 */
export function ModuloCard({ modulo, onSelect, onEdit, onToggleEstado, onDelete }) {
  const capacidad = Number(modulo.capacidad_operarios || 0);
  const asignados = Math.round(Number(modulo.promedio_personas ?? 0));
  const eficiencia = Math.round(Number(modulo.eficiencia || 0));
  const meta = Math.round(Number(modulo.meta_dia || 0));
  const perdidos = Number(modulo.minutos_perdidos_persona || 0);

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <button onClick={() => onSelect?.(modulo)} className="text-left" type="button">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F4C3F]/10">
              <Factory className="h-4 w-4 text-[#0F4C3F]" />
            </div>
            <h3 className="font-bold text-gray-900">{modulo.nombre}</h3>
          </div>
          <p className="ml-10 mt-1 text-xs text-gray-400">
            {modulo.codigo} · {modulo.ubicacion || "Sin ubicacion"}
          </p>
        </button>
        <StatusBadge status={modulo.estado} />
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-gray-500">Eficiencia del dia</span>
          <span className="font-medium text-gray-700">
            {formatNumero(modulo.unidades_producidas)} de {formatNumero(meta)} und
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${eficiencia >= 100 ? "bg-green-500" : "bg-[#0F4C3F]"}`}
            style={{ width: `${Math.min(eficiencia, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{eficiencia}%</p>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-gray-400">Meta del dia</dt>
          <dd className="font-medium text-gray-800">{formatNumero(meta)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">Personas</dt>
          <dd className="font-medium text-gray-800">
            {asignados} de {capacidad}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">Facturacion</dt>
          <dd className="truncate font-medium text-gray-800">
            {formatMoneda(modulo.facturacion_real)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">Min. perdidos</dt>
          <dd className={`font-medium ${perdidos > 0 ? "text-red-600" : "text-gray-800"}`}>
            {formatNumero(perdidos)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <span className="text-sm font-bold text-[#0F4C3F]">
          {Number(modulo.prendas_por_hora || 0).toFixed(1)} prendas/hora
        </span>
        <RowActions
          className="opacity-60 transition-opacity group-hover:opacity-100"
          acciones={accionesEstandar({
            fila: modulo,
            onDetalle: onSelect,
            onEdit,
            onToggleEstado,
            onDelete,
          })}
        />
      </div>
    </div>
  );
}
