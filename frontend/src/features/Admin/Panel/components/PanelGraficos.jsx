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

/** Paleta del panel, aplicada por indice cuando la serie no trae color. */
const palette = ["#0F4C3F", "#0F4C3F", "#E3A81B", "#10b981", "#7AB396", "#24973A", "#ef4444"];

/**
 * Las cuatro graficas de produccion del panel.
 *
 * Antes existian dos veces --`ProductivityCharts` del Dashboard y
 * `ReportesGraficos`-- pintando las MISMAS cuatro series (produccion por
 * modulo, top de operarias, produccion por cliente y tendencia) con
 * diferencias solo cosmeticas. Eran dos sitios que corregir cada vez que
 * cambiaba una consulta, y dos respuestas posibles a la misma pregunta.
 *
 * Las llaves de cada serie son las columnas de las vistas de la base:
 *   productividadPorModulo -> vw_estado_modulo_dia agrupada
 *   topOperarios           -> vw_productividad_operario
 *   produccionPorCliente   -> vw_avance_orden agrupada por nombre_cliente
 *   tendencia              -> serie diaria de produccion y eficiencia
 */
export function PanelGraficos({ charts = {}, tituloTendencia = "Tendencia de eficiencia" }) {
  const {
    productividadPorModulo = [],
    topOperarios = [],
    produccionPorCliente = [],
    tendencia = [],
  } = charts;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="Produccion por modulo" data={productividadPorModulo}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productividadPorModulo}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="codigo_modulo" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_producido" name="Producido" fill="#0F4C3F" radius={[8, 8, 0, 0]} />
            <Bar
              dataKey="total_defectuoso"
              name="Defectuoso"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top operarias - produccion atribuida" data={topOperarios}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topOperarios} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis
              dataKey="nombre_operario"
              type="category"
              stroke="#6b7280"
              width={130}
              fontSize={11}
            />
            <Tooltip />
            <Bar
              dataKey="total_producido"
              name="Unidades atribuidas"
              fill="#0F4C3F"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Produccion por cliente" data={produccionPorCliente}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={produccionPorCliente}
              cx="50%"
              cy="50%"
              outerRadius={95}
              label={({ nombre_cliente, percent }) =>
                `${nombre_cliente} ${(percent * 100).toFixed(0)}%`
              }
              nameKey="nombre_cliente"
              dataKey="total_producido"
            >
              {produccionPorCliente.map((entry, index) => (
                <Cell
                  key={entry.nombre_cliente ?? index}
                  fill={entry.color || palette[index % palette.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={tituloTendencia} data={tendencia}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendencia}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="periodo" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="eficiencia"
              name="Eficiencia %"
              stroke="#0F4C3F"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="unidades_producidas"
              name="Unidades"
              stroke="#0F4C3F"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
