import { BarChart3 } from "lucide-react";
import { Card } from "./card";

/**
 * Contenedor de graficas. Mientras `data` este vacio muestra un placeholder en
 * lugar de una grafica en blanco, dejando lista la estructura visual.
 */
export function ChartCard({ title, data = [], height = 300, children }) {
  return (
    <Card className="bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">{title}</h3>

      {data.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-400"
          style={{ height }}
        >
          <BarChart3 className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">Sin datos para graficar</p>
          <p className="text-xs">Se llenara al conectar la API</p>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
