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

const palette = ["#433A9B", "#F39A3D", "#F3D33B", "#10b981", "#06b6d4", "#8b5cf6", "#ef4444"];

/** Series con las columnas de las vistas de productividad. */
export function ReportesGraficos({ charts = {} }) {
  const {
    productividadPorModulo = [],
    productividadPorOperario = [],
    produccionPorMarca = [],
    tendenciaMensual = [],
  } = charts;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="Productividad por Modulo" data={productividadPorModulo}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productividadPorModulo}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="codigo_modulo" />
            <YAxis yAxisId="left" orientation="left" stroke="#433A9B" />
            <YAxis yAxisId="right" orientation="right" stroke="#F39A3D" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="total_producido" fill="#433A9B" name="Producido" />
            <Bar yAxisId="right" dataKey="porcentaje_defectos" fill="#F39A3D" name="Defectos %" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top Operarios - Productividad" data={productividadPorOperario}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productividadPorOperario} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" />
            <YAxis dataKey="nombre_operario" type="category" width={120} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_producido" fill="#433A9B" name="Producido" />
            <Bar dataKey="prendas_por_hora" fill="#F3D33B" name="Prendas/hora" />
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

      <ChartCard title="Tendencia Mensual" data={tendenciaMensual}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendenciaMensual}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="periodo" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_producido"
              stroke="#433A9B"
              strokeWidth={2}
              name="Producido"
            />
            <Line
              type="monotone"
              dataKey="cantidad_meta"
              stroke="#F39A3D"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Meta"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
