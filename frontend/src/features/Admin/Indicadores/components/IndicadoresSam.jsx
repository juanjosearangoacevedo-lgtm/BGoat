import { Scale } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import { GUION } from "@/shared/utils/formatters";

/**
 * SAM pactado vs SAM observado por referencia.
 *
 * Es el indicador que responde la pregunta economica del negocio: si el SAM
 * real esta por encima del pactado, la empresa esta regalando minutos; si
 * esta por debajo, el contrato deja margen.
 */
const columnas = [
  { key: "codigo_referencia", header: "Referencia" },
  { key: "nombre_marca", header: "Marca" },
  { key: "nombre_cliente", header: "Cliente", render: (fila) => fila.nombre_cliente || GUION },
  {
    key: "sam_pactado",
    header: "SAM pactado",
    align: "center",
    render: (fila) => (fila.sam_pactado ? `${fila.sam_pactado} min` : GUION),
  },
  {
    key: "sam_observado",
    header: "SAM real",
    align: "center",
    render: (fila) => (fila.sam_observado ? `${fila.sam_observado} min` : GUION),
  },
  {
    key: "desviacion_porcentaje",
    header: "Desviacion",
    align: "center",
    render: (fila) => {
      const valor = Number(fila.desviacion_porcentaje || 0);
      const excede = valor > 0;
      return (
        <span className={`font-semibold ${excede ? "text-red-600" : "text-green-600"}`}>
          {excede ? "+" : ""}
          {valor}%
        </span>
      );
    },
  },
  {
    key: "tarifa_minuto_real",
    header: "Tarifa real / min",
    align: "center",
    render: (fila) =>
      fila.tarifa_minuto_real
        ? Number(fila.tarifa_minuto_real).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          })
        : GUION,
  },
  { key: "unidades_producidas", header: "Unidades", align: "center" },
];

export function IndicadoresSam({ datos = [], loading }) {
  return (
    <div className="mt-6">
      <h3 className="mb-1 font-bold text-gray-900">SAM pactado vs SAM real</h3>
      <p className="mb-4 text-sm text-gray-500">
        Una desviacion positiva significa que la prenda toma mas minutos de los que el cliente paga.
        Es el argumento con datos para la proxima negociacion.
      </p>
      <DataTable
        columns={columnas}
        rows={datos}
        loading={loading}
        rowKey="id_referencia"
        empty={{
          icon: Scale,
          title: "Sin datos de SAM todavia",
          description:
            "El SAM real se calcula con la produccion registrada. Captura horas para que aparezca la comparacion.",
        }}
      />
    </div>
  );
}
