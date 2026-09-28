import { AlertTriangle } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import { statusLabel } from "@/shared/components/StatusBadge";
import { formatMoneda, formatNumero, GUION } from "@/shared/utils/formatters";

/**
 * Lo PLANEADO/INTERNO se resuelve adentro; lo EXTERNO es del cliente y es
 * negociable. No usa `StatusBadge` porque esos tres valores no son un
 * estado del ciclo de vida de un registro, son de donde viene el problema.
 */
const estiloTipo = {
  PLANEADA: "bg-[#DCEAE1] text-[#1F5C45]",
  INTERNA: "bg-[#DCEAE1] text-[#1F5C45]",
  EXTERNA: "bg-[#D64545]/15 text-[#D64545]",
};

const columnas = [
  {
    key: "nombre_causa",
    header: "Causa",
    render: (fila) => (
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-800">{fila.nombre_causa}</p>
        <p className="truncate text-xs text-gray-400">{fila.responsable || GUION}</p>
      </div>
    ),
  },
  {
    key: "tipo_causa",
    header: "Tipo",
    align: "center",
    render: (fila) => (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          estiloTipo[fila.tipo_causa] || "bg-[#F6F8F7] text-[#5C6B64]"
        }`}
      >
        {statusLabel(fila.tipo_causa)}
      </span>
    ),
  },
  {
    key: "minutos_perdidos",
    header: "Minutos perdidos",
    align: "center",
    sortValue: (fila) => Number(fila.minutos_perdidos || 0),
    render: (fila) => formatNumero(fila.minutos_perdidos),
  },
  {
    key: "porcentaje",
    header: "% del total",
    align: "center",
    sortValue: (fila) => Number(fila.porcentaje || 0),
    render: (fila) => `${Number(fila.porcentaje || 0).toFixed(1)}%`,
  },
  {
    key: "unidades_no_producidas",
    header: "Unidades no producidas",
    align: "center",
    render: (fila) => formatNumero(fila.unidades_no_producidas),
  },
  {
    key: "facturacion_no_realizada",
    header: "Facturacion no realizada",
    align: "center",
    sortValue: (fila) => Number(fila.facturacion_no_realizada || 0),
    render: (fila) => (
      <span className="font-semibold text-[#D64545]">
        {formatMoneda(fila.facturacion_no_realizada)}
      </span>
    ),
  },
];

/**
 * Tiempo perdido por causa, de mayor a menor.
 *
 * Antes era un Pareto (barras + linea de acumulado): con dos o tres
 * causas en el periodo -que es lo normal- una sola barra estirada no
 * dice nada y la linea salta directo al 100%. La tabla se lee igual con
 * una causa que con diez, y de paso muestra la plata que costo cada una,
 * que el grafico nunca mostraba.
 */
export function TablaCausas({ datos = [], totalMinutosPerdidos = 0, loading }) {
  return (
    <div>
      <h3 className="mb-1 font-bold text-gray-900">
        Tiempo perdido por causa · {formatNumero(totalMinutosPerdidos)} min
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Ordenado de mayor a menor: ataca primero la fila de arriba. Lo EXTERNO es tiempo perdido
        imputable al cliente, es negociable.
      </p>
      <DataTable
        columns={columnas}
        rows={datos}
        loading={loading}
        rowKey="codigo_causa"
        empty={{
          icon: AlertTriangle,
          title: "Sin tiempo perdido en el periodo",
          description: "Ninguna incidencia registrada en el rango de fechas seleccionado.",
        }}
      />
    </div>
  );
}
