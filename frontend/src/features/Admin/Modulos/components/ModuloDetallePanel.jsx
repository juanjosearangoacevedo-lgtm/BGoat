import { X } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatNumero, iniciales, nombreCompleto } from "@/shared/utils/formatters";
import { capacidadSemanalMinutos } from "../hooks/useModulosPage";

/** Detalle de un `modulo` con sus asignaciones activas (`asignaciones_modulo`). */
export function ModuloDetallePanel({ modulo, onClose }) {
  if (!modulo) return null;

  const operarios = modulo.operarios || [];
  const eficiencia = Math.round(Number(modulo.eficiencia || 0));

  const configuracion = [
    { label: "Capacidad de operarios", value: modulo.capacidad_operarios ?? 0 },
    { label: "Horas de jornada", value: modulo.horas_jornada ?? 9 },
    { label: "Umbral de cumplimiento", value: (modulo.umbral_cumplimiento ?? 85) + "%" },
    { label: "Horas semanales", value: `${modulo.horas_semanales ?? 0} h` },
    { label: "Eficiencia esperada", value: `${modulo.eficiencia_esperada ?? 0}%` },
    { label: "Capacidad semanal", value: `${formatNumero(capacidadSemanalMinutos(modulo))} min-hombre` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col bg-white shadow-2xl md:w-[480px]">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{modulo.nombre}</h2>
            <p className="text-xs text-gray-500">
              {modulo.codigo} · {modulo.ubicacion || "Sin ubicacion"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={modulo.estado} />
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" type="button" aria-label="Cerrar">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="rounded-xl bg-[#433A9B]/5 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-[#433A9B]">Eficiencia del dia</span>
              <span className="font-bold text-[#433A9B]">{eficiencia}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[#433A9B]" style={{ width: `${eficiencia}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-[#433A9B]/70">
              <span>{formatNumero(modulo.unidades_producidas)} producidas</span>
              <span>{modulo.horas_registradas || 0} horas registradas</span>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="mb-3 text-xs font-medium text-gray-600">Configuracion del modulo</p>
            <div className="space-y-2">
              {configuracion.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-gray-900">Personal asignado ({operarios.length})</h3>
            {operarios.length === 0 ? (
              <p className="text-sm text-gray-400">Sin asignaciones activas para este modulo.</p>
            ) : (
              <div className="space-y-2">
                {operarios.map((operario) => (
                  <div key={operario.id_operario} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#433A9B]/10 text-sm font-bold text-[#433A9B]">
                      {iniciales(nombreCompleto(operario))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{nombreCompleto(operario)}</p>
                      <p className="text-xs text-gray-500">
                        {operario.codigo_operario} · {operario.rol_asignacion || operario.cargo}
                        {operario.turno ? ` · turno ${operario.turno.toLowerCase()}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={operario.estado} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {modulo.observaciones && (
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-1 text-xs font-medium text-gray-600">Observaciones</p>
              <p className="text-sm text-gray-600">{modulo.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
