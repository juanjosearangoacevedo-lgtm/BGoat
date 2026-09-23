import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/shared/components/ChartCard";
import { statusLabel } from "@/shared/components/StatusBadge";
import { formatNumero } from "@/shared/utils/formatters";

/** Color por estado de lote (mismos ENUM de la tabla `lotes`). */
const coloresEstadoLote = {
  REGISTRADO: "#3b82f6",
  EN_PROCESO: "#0F4C3F",
  FINALIZADO: "#10b981",
  CANCELADO: "#ef4444",
  INACTIVO: "#9ca3af",
};

/** Color por tipo de causa: lo del cliente se ve distinto de lo propio. */
const coloresTipoCausa = {
  PLANEADA: "#0F4C3F",
  INTERNA: "#0F4C3F",
  EXTERNA: "#ef4444",
};

export function GraficosIncidencias({ charts = {}, totalMinutosPerdidos = 0 }) {
  const { tendencia = [], causas = [], estadoLotes = [], plantaHora = [] } = charts;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ChartCard title="Tendencia de eficiencia y produccion" data={tendencia}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="periodo" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="eficiencia"
                name="Eficiencia (%)"
                stroke="#0F4C3F"
                fill="#0F4C3F"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="unidades_producidas"
                name="Unidades"
                stroke="#0F4C3F"
                fill="#0F4C3F"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Estado de los lotes" data={estadoLotes}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={estadoLotes}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="total"
              nameKey="estado"
            >
              {estadoLotes.map((entrada) => (
                <Cell key={entrada.estado} fill={coloresEstadoLote[entrada.estado] || "#9ca3af"} />
              ))}
            </Pie>
            <Tooltip formatter={(valor, nombre) => [valor, statusLabel(nombre)]} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="lg:col-span-2">
        <ChartCard
          title={`Tiempo perdido por causa (Pareto) · ${formatNumero(totalMinutosPerdidos)} min`}
          data={causas}
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={causas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nombre_causa" stroke="#6b7280" fontSize={11} interval={0} angle={-12} height={60} />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" unit="%" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="minutos_perdidos" name="Minutos perdidos">
                {causas.map((entrada) => (
                  <Cell
                    key={entrada.codigo_causa}
                    fill={coloresTipoCausa[entrada.tipo_causa] || "#9ca3af"}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="porcentaje_acumulado"
                name="Acumulado (%)"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            {Object.entries(coloresTipoCausa).map(([tipo, color]) => (
              <span key={tipo} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {statusLabel(tipo)}
              </span>
            ))}
            <span className="text-gray-400">
              Lo EXTERNO es tiempo perdido imputable al cliente: es negociable.
            </span>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="La planta hora por hora" data={plantaHora}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={plantaHora}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hora_jornada" stroke="#6b7280" tickFormatter={(valor) => `H${valor}`} />
            <YAxis stroke="#6b7280" />
            <Tooltip labelFormatter={(valor) => `Hora ${valor}`} />
            <Bar dataKey="eficiencia" name="Eficiencia (%)" fill="#0F4C3F" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-gray-400">
          Si varios modulos caen en la misma hora, el problema no es de un modulo: es de la planta.
        </p>
      </ChartCard>
    </div>
  );
}
