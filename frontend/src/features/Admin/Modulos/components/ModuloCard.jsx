import { Factory } from "lucide-react";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatNumero, iniciales } from "@/shared/utils/formatters";

/** Tarjeta de un registro de `modulos` con los datos del dia. */
export function ModuloCard({ modulo, onSelect, onEdit, onToggleEstado, onDelete }) {
  const operarios = modulo.operarios || [];
  const capacidad = Number(modulo.capacidad_operarios || 0);
  const asignados = Math.round(Number(modulo.promedio_personas ?? 0));
  const eficiencia = Math.round(Number(modulo.eficiencia || 0));

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <button onClick={() => onSelect?.(modulo)} className="text-left" type="button">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#433A9B]/10">
              <Factory className="h-4 w-4 text-[#433A9B]" />
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
            {formatNumero(modulo.unidades_producidas)} und
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${eficiencia >= 100 ? "bg-green-500" : "bg-[#433A9B]"}`}
            style={{ width: `${Math.min(eficiencia, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{eficiencia}%</p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs text-gray-400">
          {asignados} de {capacidad} posiciones ocupadas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: Math.max(capacidad, asignados) }).map((_, index) => {
            const operario = operarios[index];
            const style = !operario
              ? "border-dashed border-gray-300 bg-gray-50 text-gray-300"
              : "border-green-400 bg-green-100 text-green-700";

            return (
              <div
                key={operario?.id_operario ?? `libre-${index}`}
                title={
                  operario
                    ? `${operario.nombres} ${operario.apellidos} · ${operario.rol_asignacion || operario.cargo || ""}`
                    : "Posicion disponible"
                }
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${style}`}
              >
                {operario ? iniciales(`${operario.nombres} ${operario.apellidos}`) : "+"}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <span className="text-sm font-bold text-[#433A9B]">
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
