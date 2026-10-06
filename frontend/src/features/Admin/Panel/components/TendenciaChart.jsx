import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/shared/components/ChartCard";

/**
 * Tendencia del periodo, en dos graficas separadas.
 *
 * Antes era una sola con dos ejes (eficiencia en % y unidades en miles):
 * aunque las dos lineas se veian, comparar sus alturas no dice nada
 * -miden cosas distintas- y eso confundia mas de lo que ayudaba. Separadas,
 * cada una se lee sola con su propio eje, sin tener que recordar cual
 * linea es de cual lado.
 */
export function TendenciaEficienciaChart({ data = [] }) {
  return (
    <ChartCard title="Eficiencia por dia" data={data}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--rejilla)" />
          <XAxis dataKey="periodo" stroke="var(--neutro-500)" fontSize={11} />
          <YAxis stroke="var(--marca-claro)" fontSize={12} unit="%" domain={[0, 100]} />
          <Tooltip formatter={(valor) => [`${valor}%`, "Eficiencia"]} />
          <Area
            type="monotone"
            dataKey="eficiencia"
            name="Eficiencia"
            stroke="var(--marca-claro)"
            strokeWidth={2}
            fill="var(--marca-claro)"
            fillOpacity={0.18}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TendenciaUnidadesChart({ data = [] }) {
  return (
    <ChartCard title="Unidades producidas por dia" data={data}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--rejilla)" />
          <XAxis dataKey="periodo" stroke="var(--neutro-500)" fontSize={11} />
          <YAxis stroke="var(--ambar)" fontSize={12} />
          <Tooltip formatter={(valor) => [valor, "Unidades"]} />
          <Area
            type="monotone"
            dataKey="unidades_producidas"
            name="Unidades"
            stroke="var(--ambar)"
            strokeWidth={2}
            fill="var(--ambar)"
            fillOpacity={0.22}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
