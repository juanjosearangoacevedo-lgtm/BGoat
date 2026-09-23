import { Factory } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import { formatNumero } from "@/shared/utils/formatters";

/**
 * Resumen por modulo del periodo.
 *
 * Las llaves son las que devuelve `GET /indicadores/productividad-modulo`,
 * que agrega `vw_estado_modulo_dia`. Antes apuntaban a una vista
 * `vw_estado_modulo_hoy` que no existe en el esquema, y la tabla salia
 * con las filas en blanco: habia datos, pero ninguna columna los
 * encontraba.
 */
const columns = [
  { key: "codigo_modulo", header: "Modulo" },
  {
    key: "nombre_modulo",
    header: "Nombre",
    render: (fila) => <span className="text-gray-500">{fila.nombre_modulo}</span>,
  },
  {
    key: "total_producido",
    header: "Producido",
    align: "center",
    render: (fila) => formatNumero(fila.total_producido),
  },
  {
    key: "total_defectuoso",
    header: "Defectos",
    align: "center",
    render: (fila) => formatNumero(fila.total_defectuoso),
  },
  {
    key: "porcentaje_defectos",
    header: "% defectos",
    align: "center",
    render: (fila) => `${Number(fila.porcentaje_defectos || 0).toFixed(2)}%`,
  },
  {
    key: "minutos_disponibles",
    header: "Minutos puestos",
    align: "center",
    render: (fila) => formatNumero(fila.minutos_disponibles),
  },
  {
    key: "prendas_por_hora",
    header: "Prendas/hora",
    align: "center",
    // El endpoint no la trae: es la misma division que hace
    // `vw_estado_modulo_dia`, sobre los minutos del periodo.
    sortValue: (fila) =>
      Number(fila.minutos_disponibles) > 0
        ? (Number(fila.total_producido) * 60) / Number(fila.minutos_disponibles)
        : 0,
    render: (fila) =>
      Number(fila.minutos_disponibles) > 0
        ? ((Number(fila.total_producido) * 60) / Number(fila.minutos_disponibles)).toFixed(1)
        : "0.0",
  },
  {
    key: "eficiencia",
    header: "Eficiencia",
    align: "center",
    render: (fila) => (
      <span
        className={`font-semibold ${
          Number(fila.eficiencia) >= 85
            ? "text-green-600"
            : Number(fila.eficiencia) >= 60
              ? "text-[#b46a12]"
              : "text-red-600"
        }`}
      >
        {Number(fila.eficiencia || 0).toFixed(2)}%
      </span>
    ),
  },
];

export function ResumenModulos({ modules = [], loading }) {
  return (
    <div className="mt-6">
      <h3 className="mb-4 font-bold text-gray-900">Resumen por modulo</h3>
      <DataTable
        columns={columns}
        rows={modules}
        loading={loading}
        rowKey="id_modulo"
        empty={{
          icon: Factory,
          title: "Sin produccion en el periodo",
          description: "Ningun modulo registro horas en el rango de fechas seleccionado.",
        }}
      />
    </div>
  );
}
