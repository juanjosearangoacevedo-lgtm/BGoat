import { Package, Plus } from "lucide-react";
import { Button } from "@/shared/components/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataList } from "@/shared/components/DataList";
import { ExportMenu } from "@/shared/components/ExportMenu";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatsGrid } from "@/shared/components/StatsGrid";
import { TablePagination } from "@/shared/components/TablePagination";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { MODOS, useViewMode } from "@/shared/hooks/useViewMode";
import { formatNumero, formatPorcentaje } from "@/shared/utils/formatters";
import { OrdenesTable, columnasOrdenes } from "../components/OrdenesTable";
import { useOrdenesPage } from "../hooks/useOrdenesPage";

export function OrdenesPage({ onNavigate }) {
  const ordenes = useOrdenesPage();
  const { lista } = ordenes;
  const vista = useViewMode("ordenes", MODOS.TABLA, [MODOS.TABLA, MODOS.LISTA]);

  const manejadores = {
    onView: (orden) => onNavigate?.("order-detail", orden),
    onEdit: (orden) => onNavigate?.("edit-order", orden),
    onDelete: ordenes.setDeleteTarget,
  };

  const columnas = columnasOrdenes(manejadores);

  const hayBusqueda = lista.hayFiltros || Boolean(ordenes.search);

  const vacio = {
    icon: Package,
    title: hayBusqueda ? "Sin resultados" : "No hay ordenes cargadas",
    description: hayBusqueda
      ? "Ninguna orden coincide con la busqueda o los filtros aplicados."
      : "Crea la primera orden para asignar un lote a un modulo y empezar a capturar produccion.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          ordenes.setSearch("");
        }}
      >
        Limpiar busqueda y filtros
      </Button>
    ) : (
      <Button
        onClick={() => onNavigate?.("create-order")}
        className="bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nueva orden
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={ordenes.loading}
      label="ordenes"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Ordenes de Produccion"
        subtitle="Asignacion de lotes a modulos y avance real de cada una"
      >
        <Button
          onClick={() => onNavigate?.("create-order")}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Plus className="h-4 w-4" />
          Nueva orden
        </Button>
      </PageHeader>

      {ordenes.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {ordenes.error}
        </div>
      )}

      <StatsGrid
        columns={4}
        items={[
          { label: "Total ordenes", value: ordenes.resumen.total },
          { label: "En proceso", value: ordenes.resumen.enProceso, color: "#F39A3D" },
          { label: "Pendientes", value: ordenes.resumen.pendientes, color: "#eab308" },
          { label: "Finalizadas", value: ordenes.resumen.finalizadas, color: "#10b981" },
        ]}
      />

      <FilterBar
        search={ordenes.search}
        onSearch={ordenes.setSearch}
        searchPlaceholder="Buscar por orden, lote, cliente o referencia..."
        definiciones={lista.definiciones}
        filtros={lista.filtros}
        onFiltro={lista.setFiltro}
        filtrosActivos={lista.filtrosActivos}
        onLimpiar={lista.limpiarFiltros}
        acciones={
          <>
            <ViewToggle
              modo={vista.modo}
              onChange={vista.setModo}
              opciones={[MODOS.TABLA, MODOS.LISTA]}
            />
            <ExportMenu
              columnas={columnas}
              filtrados={lista.filtrados}
              todos={ordenes.items}
              archivo="ordenes-produccion"
              label="ordenes"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA ? (
        <OrdenesTable
          columnas={columnas}
          orders={lista.visibles}
          loading={ordenes.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      ) : (
        <DataList
          items={lista.visibles}
          rowKey="id_orden_produccion"
          loading={ordenes.loading}
          empty={vacio}
          footer={paginacion}
          onClick={(orden) => onNavigate?.("order-detail", orden)}
          avatar={() => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#433A9B] to-[#5a4fb8] text-white">
              <Package className="h-4 w-4" />
            </div>
          )}
          primario={(orden) => orden.numero_orden}
          secundario={(orden) =>
            [orden.nombre_cliente, orden.codigo_referencia].filter(Boolean).join(" · ") ||
            "Sin cliente"
          }
          meta={(orden) => [
            { label: "Modulo", value: orden.codigo_modulo },
            {
              label: "Avance",
              value: `${formatPorcentaje(orden.porcentaje_avance)} · ${formatNumero(
                orden.unidades_producidas,
              )}/${formatNumero(orden.cantidad_programada)}`,
            },
            { label: "Prioridad", value: orden.prioridad },
          ]}
          estado={(orden) => orden.estado}
          acciones={(orden) => (
            <RowActions
              acciones={accionesEstandar({
                fila: orden,
                onDetalle: manejadores.onView,
                onEdit: manejadores.onEdit,
                onDelete: manejadores.onDelete,
              })}
            />
          )}
        />
      )}

      <ConfirmDialog
        open={Boolean(ordenes.deleteTarget)}
        title="Eliminar orden de produccion?"
        description={
          `Se eliminara la orden ${ordenes.deleteTarget?.numero_orden || ""}. ` +
          "No se puede eliminar una orden con produccion registrada."
        }
        confirmLabel="Confirmar"
        loading={ordenes.procesando}
        onCancel={() => ordenes.setDeleteTarget(null)}
        onConfirm={() => ordenes.eliminar(ordenes.deleteTarget)}
      />
    </div>
  );
}
