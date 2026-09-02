import { Clock } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, GUION } from "@/shared/utils/formatters";

/**
 * Horas capturadas de la orden (vista `vw_registro_horario`).
 * Es el historico del tablero: lo que antes se borraba cada noche.
 */
export function OrdenRegistros({ registros = [] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 font-bold text-gray-900">
        <Clock className="h-4 w-4 text-[#433A9B]" />
        Horas registradas ({registros.length})
      </h3>

      {registros.length === 0 ? (
        <p className="text-sm text-gray-400">
          Todavia no hay horas capturadas para esta orden. Se registran desde la pantalla de Captura.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Hora</th>
                <th className="py-2 pr-3 text-center">Personas</th>
                <th className="py-2 pr-3 text-center">Producidas</th>
                <th className="py-2 pr-3 text-center">Meta</th>
                <th className="py-2 pr-3 text-center">Cumpl.</th>
                <th className="py-2">Causa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registros.map((registro) => (
                <tr key={registro.id_registro}>
                  <td className="py-2 pr-3 text-gray-600">{formatFecha(registro.fecha)}</td>
                  <td className="py-2 pr-3 text-gray-600">H{registro.hora_jornada}</td>
                  <td className="py-2 pr-3 text-center text-gray-700">{registro.personas_presentes}</td>
                  <td className="py-2 pr-3 text-center font-medium text-gray-900">
                    {registro.unidades_producidas}
                    {registro.unidades_defectuosas > 0 && (
                      <span className="ml-1 text-xs text-red-500">({registro.unidades_defectuosas})</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-center text-gray-500">{registro.meta_hora}</td>
                  <td className="py-2 pr-3 text-center">
                    <span
                      className={`font-medium ${
                        Number(registro.cumplimiento) >= Number(registro.umbral_cumplimiento)
                          ? "text-green-600"
                          : "text-[#b46a12]"
                      }`}
                    >
                      {Math.round(registro.cumplimiento)}%
                    </span>
                  </td>
                  <td className="py-2">
                    {registro.nombre_causa ? (
                      <StatusBadge status={registro.tipo_causa} />
                    ) : (
                      <span className="text-gray-300">{GUION}</span>
                    )}
                    {registro.nombre_causa && (
                      <span className="ml-2 text-xs text-gray-500">{registro.nombre_causa}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
