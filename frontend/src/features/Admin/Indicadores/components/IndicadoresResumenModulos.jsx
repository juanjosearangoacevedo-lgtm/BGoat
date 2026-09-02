import { Factory } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";

/** Resumen de la vista `vw_estado_modulo_hoy`. */
const columns = [
  { key: "codigo", header: "Modulo" },
  { key: "operarios_asignados", header: "Operarios", align: "center" },
  { key: "cantidad_producida", header: "Producido", align: "center" },
  { key: "meta_diaria", header: "Meta", align: "center" },
  { key: "porcentaje_cumplimiento", header: "Cumplimiento %", align: "center" },
  { key: "cantidad_defectuosa", header: "Defectos", align: "center" },
  { key: "prendas_por_hora", header: "Prendas/hora", align: "center" },
];

export function IndicadoresResumenModulos({ modules = [], loading }) {
  return (
    <div className="mt-6">
      <h3 className="mb-4 font-bold text-gray-900">Resumen por Modulo</h3>
      <DataTable
        columns={columns}
        rows={modules}
        loading={loading}
        rowKey="id_modulo"
        empty={{
          icon: Factory,
          title: "Sin modulos para resumir",
          description: "El resumen se llena con la vista vw_estado_modulo_hoy que entregue la API.",
        }}
      />
    </div>
  );
}
