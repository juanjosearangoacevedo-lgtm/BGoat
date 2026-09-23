import { AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/shared/components/card";
import { Progress } from "@/shared/components/progress";
import { formatFecha, formatNumero } from "@/shared/utils/formatters";

/**
 * Ordenes en riesgo de incumplir la fecha comprometida.
 *
 * Es la alerta que hoy no existe: el dueno se entera del atraso cuando el
 * cliente reclama. Aqui aparece con dias de anticipacion.
 */
export function OrdenesRiesgo({ ordenes = [], onNavigate }) {
  if (ordenes.length === 0) {
    return (
      <Card className="flex items-center gap-3 bg-green-50 p-5">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
        <p className="text-sm text-green-800">
          Ninguna orden en riesgo: todas las fechas comprometidas estan a mas de 7 dias o al dia.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-[#0F4C3F] bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-[#D08E10]" />
        <h3 className="text-lg font-bold text-gray-900">
          Ordenes en riesgo ({ordenes.length})
        </h3>
      </div>

      <div className="space-y-3">
        {ordenes.map((orden) => {
          const dias = Number(orden.dias_restantes);
          const vencida = dias < 0;

          return (
            <button
              key={orden.numero_orden}
              type="button"
              onClick={() => onNavigate?.("orders")}
              className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className="min-w-40 flex-1">
                <p className="font-semibold text-gray-900">{orden.numero_orden}</p>
                <p className="text-xs text-gray-500">
                  {orden.nombre_referencia} · {orden.codigo_modulo}
                  {orden.nombre_cliente ? ` · ${orden.nombre_cliente}` : ""}
                </p>
              </div>

              <div className="w-40">
                <Progress value={Number(orden.porcentaje_avance || 0)} className="h-2" />
                <p className="mt-1 text-xs text-gray-500">
                  {formatNumero(orden.unidades_producidas)} / {formatNumero(orden.cantidad_programada)}
                  {" · "}
                  {Math.round(orden.porcentaje_avance)}%
                </p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-bold ${vencida ? "text-red-600" : "text-[#b46a12]"}`}>
                  {vencida ? `${Math.abs(dias)} dias vencida` : `${dias} dias`}
                </p>
                <p className="text-xs text-gray-400">{formatFecha(orden.fecha_fin_programada)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
