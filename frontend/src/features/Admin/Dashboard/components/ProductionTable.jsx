import { Factory } from "lucide-react";
import { Card } from "@/shared/components/card";
import { EmptyState } from "@/shared/components/EmptyState";
import { Progress } from "@/shared/components/progress";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatNumero, GUION } from "@/shared/utils/formatters";

const headers = ["Modulo", "Operarios", "Orden", "Referencia", "Avance orden", "Unidades", "Estado"];

/**
 * Produccion en tiempo real: vista `vw_estado_modulo_dia` cruzada con la
 * orden activa de cada modulo (`vw_avance_orden`), tal como las entrega
 * /indicadores/estado-modulos.
 *
 * Los nombres son los de la base, sin renombrar:
 *   Operarios -> `promedio_personas` (personas presentes hoy en el modulo)
 *   Avance    -> `porcentaje_avance` (lo que lleva la orden, no el dia)
 *   Unidades  -> `unidades_producidas` / `meta_dia` (produccion del dia)
 * La eficiencia del dia (`eficiencia`) vive en el KPI "Eficiencia del Dia".
 */
export function ProductionTable({ rows = [], loading = false }) {
  return (
    <Card className="bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Produccion en Tiempo Real</h3>
          <p className="mt-1 text-sm text-gray-500">Estado actual de los modulos de produccion</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const avance = Math.min(Math.round(Number(item.porcentaje_avance || 0)), 100);

              return (
                <tr key={item.id_modulo} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <span className="font-medium text-gray-900">{item.codigo}</span>
                    <span className="ml-2 text-xs text-gray-400">{item.nombre}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#433A9B]/10">
                      <span className="text-sm font-medium text-[#433A9B]">
                        {Math.round(Number(item.promedio_personas || 0))}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{item.numero_orden || GUION}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{item.nombre_referencia || GUION}</td>
                  <td className="px-4 py-4">
                    {item.numero_orden ? (
                      <div className="w-32">
                        <Progress value={avance} className="h-2" />
                        <span className="mt-1 text-xs text-gray-500">{avance}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{GUION}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatNumero(item.unidades_producidas)}/
                    {formatNumero(Math.round(Number(item.meta_dia || 0)))}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.estado} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && (
        <EmptyState
          icon={Factory}
          title="Sin produccion registrada"
          description="La tabla queda lista para mostrar el estado de los modulos en cuanto se conecte la API."
        />
      )}
    </Card>
  );
}
