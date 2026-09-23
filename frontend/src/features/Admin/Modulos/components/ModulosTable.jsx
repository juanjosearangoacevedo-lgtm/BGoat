import { Factory } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatMoneda, formatNumero, GUION } from "@/shared/utils/formatters";

/**
 * Columnas del listado de `modulos` cruzado con su estado del dia.
 * Las comparte la vista de tabla, el modo lista y la exportacion a CSV.
 *
 * Son las mismas del tablero de la empresa, en el mismo orden: cuanta
 * gente, cuanto debia salir, cuanto salio, a que eficiencia, con que SAM,
 * cuanta plata y cuanto tiempo se perdio. Ninguna se digita aqui: todas
 * vienen de `vw_estado_modulo_dia`.
 */
export function columnasModulos({ onDetalle, onEdit, onToggleEstado, onDelete } = {}) {
  return [
    {
      key: "codigo",
      header: "Modulo",
      sortable: true,
      render: (modulo) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#0F4C3F]/10 text-[#0F4C3F]">
            <Factory className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{modulo.nombre}</p>
            <p className="truncate text-xs text-gray-400">{modulo.codigo}</p>
          </div>
        </div>
      ),
      exportar: (modulo) => modulo.codigo,
    },
    {
      key: "ubicacion",
      header: "Ubicacion",
      sortable: true,
      render: (modulo) => modulo.ubicacion || <span className="text-gray-300">{GUION}</span>,
      exportar: (modulo) => modulo.ubicacion || "",
    },
    {
      key: "capacidad_operarios",
      header: "Personal",
      align: "center",
      sortable: true,
      render: (modulo) => (
        <span className="text-sm text-gray-700">
          {Math.round(Number(modulo.promedio_personas || 0))} / {Number(modulo.capacidad_operarios || 0)}
        </span>
      ),
      exportar: (modulo) => Number(modulo.capacidad_operarios || 0),
    },
    {
      key: "unidades_producidas",
      header: "Producido / meta",
      align: "right",
      sortable: true,
      // La meta del dia es la suma de las metas de cada franja, no el
      // producido de una hora por nueve: las franjas no duran lo mismo.
      render: (modulo) => (
        <div className="leading-tight">
          <span className="font-medium text-gray-900">{formatNumero(modulo.unidades_producidas)}</span>
          <span className="block text-xs text-gray-400">
            de {formatNumero(Math.round(Number(modulo.meta_dia || 0)))}
          </span>
        </div>
      ),
      exportar: (modulo) => Number(modulo.unidades_producidas || 0),
    },
    {
      key: "meta_dia",
      header: "Meta del dia",
      align: "right",
      sortable: true,
      exportable: true,
      oculta: true,
      exportar: (modulo) => Math.round(Number(modulo.meta_dia || 0)),
    },
    {
      key: "eficiencia",
      header: "Eficiencia",
      sortable: true,
      render: (modulo) => {
        const eficiencia = Math.round(Number(modulo.eficiencia || 0));
        return (
          <div className="w-24">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${eficiencia >= 100 ? "bg-green-500" : "bg-[#0F4C3F]"}`}
                style={{ width: `${Math.min(eficiencia, 100)}%` }}
              />
            </div>
            <span className="mt-1 block text-xs text-gray-400">{eficiencia}%</span>
          </div>
        );
      },
      exportar: (modulo) => `${Math.round(Number(modulo.eficiencia || 0))}%`,
    },
    {
      key: "sam_observado",
      header: "SAM pact / obs",
      align: "center",
      sortable: true,
      // Los dos SAM juntos son la linea de rentabilidad: si el observado
      // sube del pactado, el modulo se demora mas de lo que el cliente paga.
      render: (modulo) => {
        const pactado = Number(modulo.sam_pactado || 0);
        const observado = Number(modulo.sam_observado || 0);
        if (!pactado && !observado) return <span className="text-gray-300">{GUION}</span>;

        return (
          <div className="leading-tight">
            <span className="text-sm text-gray-700">{pactado ? pactado.toFixed(2) : GUION}</span>
            <span
              className={`block text-xs ${
                observado && pactado && observado > pactado ? "text-red-500" : "text-gray-400"
              }`}
            >
              {observado ? observado.toFixed(2) : GUION}
            </span>
          </div>
        );
      },
      exportar: (modulo) =>
        `${Number(modulo.sam_pactado || 0).toFixed(2)} / ${Number(modulo.sam_observado || 0).toFixed(2)}`,
    },
    {
      key: "facturacion_real",
      header: "Facturacion",
      align: "right",
      sortable: true,
      render: (modulo) => {
        const real = Number(modulo.facturacion_real || 0);
        const cumplimiento = modulo.cumplimiento_facturacion;
        if (!real) return <span className="text-gray-300">{GUION}</span>;

        return (
          <div className="leading-tight">
            <span className="font-medium text-gray-900">{formatMoneda(real)}</span>
            <span className="block text-xs text-gray-400">
              {cumplimiento == null ? GUION : `${Number(cumplimiento).toFixed(1)}% de la meta`}
            </span>
          </div>
        );
      },
      exportar: (modulo) => Number(modulo.facturacion_real || 0),
    },
    {
      key: "facturacion_meta",
      header: "Meta facturacion",
      oculta: true,
      exportar: (modulo) => Number(modulo.facturacion_meta || 0),
    },
    {
      key: "minutos_perdidos_persona",
      header: "Min. perdidos",
      align: "center",
      sortable: true,
      // Minutos-persona: es la unidad en la que estan los minutos puestos,
      // asi que es el unico numero comparable contra ellos.
      render: (modulo) => {
        const perdidos = Number(modulo.minutos_perdidos_persona || 0);
        return perdidos > 0 ? (
          <span className="font-medium text-red-600">{formatNumero(perdidos)}</span>
        ) : (
          <span className="text-gray-300">{GUION}</span>
        );
      },
      exportar: (modulo) => Number(modulo.minutos_perdidos_persona || 0),
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      render: (modulo) => <StatusBadge status={modulo.estado} />,
      exportar: (modulo) => modulo.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (modulo) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: modulo, onDetalle, onEdit, onToggleEstado, onDelete })}
        />
      ),
    },
  ];
}

export function ModulosTable({ columnas, modulos = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={modulos}
      loading={loading}
      rowKey="id_modulo"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
