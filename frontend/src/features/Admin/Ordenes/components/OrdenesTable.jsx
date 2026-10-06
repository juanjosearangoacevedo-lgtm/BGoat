import { DataTable } from "@/shared/components/DataTable";
import { Progress } from "@/shared/components/progress";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatNumero, GUION } from "@/shared/utils/formatters";
import { PrioridadBadge } from "./PrioridadBadge";

/**
 * Columnas del listado de la vista `vw_avance_orden`.
 * Las comparte la tabla y la exportacion a CSV.
 *
 * La tabla muestra solo cinco: N. de orden, cliente, lote, modulo y
 * referencia. El resto lleva `oculta: true`: no se pinta en la tabla
 * pero si sale en la exportacion, y se ve completo en el detalle (ojo).
 */
export function columnasOrdenes({ onView, onEdit, onDelete } = {}) {
  return [
    {
      key: "numero_orden",
      header: "N. Orden",
      sortable: true,
      render: (orden) => <span className="font-medium text-gray-900">{orden.numero_orden}</span>,
      exportar: (orden) => orden.numero_orden,
    },
    {
      key: "nombre_cliente",
      header: "Cliente",
      sortable: true,
      render: (orden) => <span className="text-sm text-gray-800">{orden.nombre_cliente || GUION}</span>,
      exportar: (orden) => orden.nombre_cliente || "",
    },
    { key: "codigo_lote", header: "Lote", sortable: true },
    {
      key: "codigo_modulo",
      header: "Modulo",
      sortable: true,
      // La orden no pertenece a un modulo: o esta libre, o la tomo uno al
      // abrir su jornada. Mientras este libre cualquiera puede cogerla.
      render: (orden) =>
        orden.codigo_modulo ? (
          <span className="text-gray-700">{orden.codigo_modulo}</span>
        ) : (
          <span className="rounded-md bg-dorado/10 px-2 py-0.5 text-xs font-medium text-dorado-texto">
            Libre
          </span>
        ),
      exportar: (orden) => orden.codigo_modulo || "Libre",
    },
    {
      key: "codigo_referencia",
      header: "Referencia",
      sortable: true,
      render: (orden) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-800">{orden.codigo_referencia || GUION}</p>
          <p className="truncate text-xs text-gray-400">{orden.nombre_referencia || GUION}</p>
        </div>
      ),
      exportar: (orden) => orden.codigo_referencia || "",
    },
    {
      key: "porcentaje_avance",
      header: "Avance",
      sortable: true,
      oculta: true,
      render: (orden) => (
        <div className="w-28">
          <Progress value={Number(orden.porcentaje_avance || 0)} className="h-2" />
          {/* La vista la llama `unidades_producidas`. Decia
              `cantidad_producida`, que no existe, asi que el numerador
              salia en 0 aunque la barra si se moviera. */}
          <span className="mt-1 block text-xs text-gray-500">
            {formatNumero(orden.unidades_producidas)} / {formatNumero(orden.cantidad_programada)}
          </span>
        </div>
      ),
      exportar: (orden) => `${Number(orden.porcentaje_avance || 0)}%`,
    },
    {
      key: "dias_atraso",
      header: "Entrega",
      sortable: true,
      oculta: true,
      // `dias_atraso` sale sola de `jornada_modulo`: el ultimo dia que un
      // modulo trabajo esta orden, comparado con la fecha en que debia
      // estar lista. Nadie la digita ni la cierra a mano.
      render: (orden) => {
        if (orden.dias_atraso === null || orden.dias_atraso === undefined) {
          return <span className="text-gray-300">{GUION}</span>;
        }
        const dias = Number(orden.dias_atraso);
        return dias > 0 ? (
          <span className="whitespace-nowrap rounded-full bg-peligro/15 px-2.5 py-1 text-xs font-medium text-peligro">
            +{dias} {dias === 1 ? "dia" : "dias"} tarde
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-marca-suave px-2.5 py-1 text-xs font-medium text-marca-texto">
            A tiempo
          </span>
        );
      },
      exportar: (orden) =>
        orden.dias_atraso === null || orden.dias_atraso === undefined
          ? ""
          : Number(orden.dias_atraso) > 0
            ? `+${orden.dias_atraso} dias tarde`
            : "A tiempo",
    },
    {
      key: "prioridad",
      header: "Prioridad",
      sortable: true,
      oculta: true,
      render: (orden) => <PrioridadBadge prioridad={orden.prioridad} />,
      exportar: (orden) => orden.prioridad,
    },
    {
      // Cuando llego el lote. Antes se mostraba `fecha_emision` (cuando
      // se digito la orden) con el rotulo "Emision", y convivian dos
      // fechas de ingreso con nombres distintos.
      key: "fecha_recepcion",
      header: "Recepcion",
      sortable: true,
      oculta: true,
      render: (orden) => formatFecha(orden.fecha_recepcion),
      exportar: (orden) => orden.fecha_recepcion || "",
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      oculta: true,
      render: (orden) => <StatusBadge status={orden.estado} />,
      exportar: (orden) => orden.estado,
    },
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (orden) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({ fila: orden, onDetalle: onView, onEdit, onDelete })}
        />
      ),
    },
  ];
}

/** Listado de la vista `vw_avance_orden`. */
export function OrdenesTable({ columnas, orders = [], loading, orden, onOrdenar, empty, footer }) {
  return (
    <DataTable
      columns={columnas}
      rows={orders}
      loading={loading}
      rowKey="id_orden_produccion"
      orden={orden}
      onOrdenar={onOrdenar}
      empty={empty}
      footer={footer}
    />
  );
}
