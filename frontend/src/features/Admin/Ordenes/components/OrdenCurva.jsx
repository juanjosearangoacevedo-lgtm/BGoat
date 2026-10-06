import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

/**
 * Curva de arranque de la orden (vista `vw_curva_arranque`).
 *
 * Muestra la eficiencia hora a hora desde que el modulo empezo la
 * referencia. Es lo que explica que un 18% no sea un modulo malo, sino un
 * arranque en curso: sin esta curva, el numero se lee al reves.
 *
 * La linea de meta es el umbral del modulo que la trabaja (cada modulo
 * tiene el suyo), no un 85 fijo. La escala va de 0 a 100% -o mas, si
 * alguna hora lo supero- para que la meta siempre quede a la vista.
 */
export function OrdenCurva({ curva = [], umbral = 85 }) {
  const conDatos = curva.length > 0;
  const ultima = conDatos ? Number(curva[curva.length - 1].eficiencia || 0) : 0;
  const maxima = conDatos ? Math.max(...curva.map((punto) => Number(punto.eficiencia || 0))) : 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold text-gray-900">
          <TrendingUp className="h-4 w-4 text-[#0F4C3F]" />
          Curva de arranque
        </h3>
        {conDatos && (
          <p className="text-xs text-gray-500">
            Ultima hora <strong className="text-[#0F4C3F]">{ultima}%</strong> · maxima {maxima}%
          </p>
        )}
      </div>

      {!conDatos ? (
        <p className="text-sm text-gray-400">
          La curva se dibuja con las horas capturadas de esta orden.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={curva}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="hora_desde_inicio"
              stroke="#6b7280"
              label={{ value: "Hora desde el inicio", position: "insideBottom", offset: -4, fontSize: 11 }}
            />
            <YAxis
              stroke="#6b7280"
              unit="%"
              domain={[0, (mayor) => Math.max(100, Math.ceil(mayor / 10) * 10)]}
            />
            <Tooltip
              formatter={(valor, nombre) => [`${valor}%`, nombre]}
              labelFormatter={(valor) => `Hora ${valor} desde el arranque`}
            />
            <ReferenceLine
              y={Number(umbral)}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: `Meta ${Number(umbral)}%`, fontSize: 11, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="eficiencia"
              name="Eficiencia"
              stroke="#0F4C3F"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
