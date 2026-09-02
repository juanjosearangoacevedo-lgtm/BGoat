import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/shared/components/ChartCard";

/** Paleta de la marca, aplicada por indice cuando la serie no trae color. */
const palette = ["#433A9B", "#F39A3D", "#F3D33B", "#10b981", "#06b6d4", "#8b5cf6", "#ef4444"];

/**
 * Graficas del tablero. Las llaves de cada serie son las columnas de las
 * vistas de la base:
 *   productividadPorModulo -> vw_productividad_modulo_diaria
 *                             (codigo_modulo, total_producido, porcentaje_defectos)
 *   topOperarios           -> vw_productividad_operario_diaria
 *                             (nombre_operario, prendas_por_hora)
 *   produccionPorMarca     -> vw_avance_orden agrupada por nombre_marca
 *   eficienciaMensual      -> cumplimiento de meta por periodo
 */
export function ProductivityCharts({ charts = {} }) {
  const {
    productividadPorModulo = [],
    topOperarios = [],
    produccionPorMarca = [],
    tendencia = [],
    plantaHora = [],
  } = charts;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="Produccion por Modulo" data={productividadPorModulo}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productividadPorModulo}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="codigo_modulo" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_producido" name="Producido" fill="#433A9B" radius={[8, 8, 0, 0]} />
            <Bar dataKey="total_defectuoso" name="Defectuoso" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top Operarios - Produccion atribuida" data={topOperarios}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topOperarios} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#6b7280" />
            <YAxis dataKey="nombre_operario" type="category" stroke="#6b7280" width={130} fontSize={11} />
            <Tooltip />
            <Bar dataKey="total_producido" name="Unidades atribuidas" fill="#433A9B" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Produccion por Marca" data={produccionPorMarca}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={produccionPorMarca}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ nombre_marca, percent }) => `${nombre_marca} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              dataKey="total_producido"
              nameKey="nombre_marca"
            >
              {produccionPorMarca.map((entry, index) => (
                <Cell key={entry.nombre_marca ?? index} fill={entry.color || palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tendencia de eficiencia del mes" data={tendencia}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendencia}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="periodo" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="eficiencia"
              name="Eficiencia (%)"
              stroke="#433A9B"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="unidades_producidas"
              name="Unidades"
              stroke="#F39A3D"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
