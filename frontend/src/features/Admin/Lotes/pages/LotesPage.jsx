import { Package2, Plus } from "lucide-react";
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
import { formatFecha, formatNumero } from "@/shared/utils/formatters";
import { LoteDetalleModal } from "../components/LoteDetalleModal";
import { LoteFormModal } from "../components/LoteFormModal";
import { LotesTable, columnasLotes } from "../components/LotesTable";
import { useLotesPage } from "../hooks/useLotesPage";

/**
 * `lotes.activo` es independiente de `lotes.estado`: el estado dice en que
 * va la produccion (Pendiente, En proceso, Finalizado) y ya no se escoge a
 * mano; `activo` es si el lote se sigue ofreciendo, y es lo unico que este
 * interruptor cambia.
 */
const estaInactivo = (lote) => !Number(lote?.activo ?? 1);

export function LotesPage() {
  const lotes = useLotesPage();
  const { lista } = lotes;
  const vista = useViewMode("lotes", MODOS.TABLA, [MODOS.TABLA, MODOS.LISTA]);

  const handleSave = () => {
    if (!lotes.validate()) return;
    lotes.guardar();
  };

  const manejadores = {
    onDetalle: lotes.verDetalle,
    onEdit: lotes.abrirEditar,
    onToggleEstado: lotes.setEstadoTarget,
    onDelete: lotes.setDeleteTarget,
  };

  const columnas = columnasLotes({ nombreCliente: lotes.nombreCliente, ...manejadores });

  // El detalle se relee del listado por id: despues de subir la ficha, el
  // objeto que se guardo al abrir el modal ya esta viejo y seguiria
  // mostrando "Sin ficha".
  const detalleVigente = lotes.detalle
    ? lotes.items.find((fila) => fila.id_lote === lotes.detalle.id_lote) ?? lotes.detalle
    : null;

  const objetivoEstado = lotes.estadoTarget;
  const activando = objetivoEstado && estaInactivo(objetivoEstado);
  const hayBusqueda = lista.hayFiltros || Boolean(lotes.search);

  const vacio = {
    icon: Package2,
    title: hayBusqueda ? "Sin resultados" : "No hay lotes cargados",
    description: hayBusqueda
      ? "Ningún lote coincide con la búsqueda o los filtros aplicados."
      : "Registra el lote que llega del cliente para poder iniciar la jornada del módulo.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          lotes.setSearch("");
        }}
      >
        Limpiar búsqueda y filtros
      </Button>
    ) : (
      <Button onClick={lotes.openCreate} className="bg-dorado text-white hover:bg-dorado-hover">
        <Plus className="mr-2 h-4 w-4" />
        Crear lote
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={lotes.loading}
      label="lotes"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Lotes" subtitle={`${lotes.total} lotes registrados`}>
        <Button
          onClick={lotes.openCreate}
          className="h-10 gap-2 rounded-xl bg-dorado px-5 text-white hover:bg-dorado-hover"
        >
          <Plus className="h-4 w-4" />
          Crear lote
        </Button>
      </PageHeader>

      {lotes.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {lotes.error}
        </div>
      )}

      <StatsGrid
        columns={5}
        variant="sutil"
        items={[
          { label: "Total lotes", value: lotes.resumen.total },
          { label: "En proceso", value: lotes.resumen.enProceso, color: "var(--dorado)" },
          { label: "Finalizados", value: lotes.resumen.entregados, color: "var(--exito-vivo)" },
          { label: "Sin SAM pactado", value: lotes.resumen.sinSam, color: "var(--peligro-vivo)" },
          { label: "Prendas recibidas", value: formatNumero(lotes.resumen.unidades), color: "var(--neutro-500)" },
        ]}
      />

      <FilterBar
        search={lotes.search}
        onSearch={lotes.setSearch}
        searchPlaceholder="Buscar por código, pedido o referencia..."
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
              todos={lotes.items}
              archivo="lotes"
              label="lotes"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA ? (
        <LotesTable
          columnas={columnas}
          lotes={lista.visibles}
          loading={lotes.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      ) : (
        <DataList
          items={lista.visibles}
          rowKey="id_lote"
          loading={lotes.loading}
          empty={vacio}
          footer={paginacion}
          onClick={lotes.verDetalle}
          avatar={() => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-marca to-marca text-white">
              <Package2 className="h-4 w-4" />
            </div>
          )}
          primario={(lote) => lote.codigo_lote}
          secundario={(lote) =>
            [lote.nombre_cliente || lotes.nombreCliente?.(lote.id_cliente), lote.codigo_referencia]
              .filter(Boolean)
              .join(" · ") || "Sin cliente"
          }
          meta={(lote) => [
            { label: "Programada", value: formatNumero(lote.cantidad_programada) },
            { label: "Recibida", value: formatNumero(lote.cantidad_recibida) },
            { label: "Recepción", value: formatFecha(lote.fecha_recepcion) },
          ]}
          estado={(lote) => lote.estado}
          acciones={(lote) => (
            <RowActions
              acciones={accionesEstandar({
                fila: lote,
                ...manejadores,
                activo: !estaInactivo(lote),
              })}
            />
          )}
        />
      )}

      <LoteFormModal
        open={lotes.modalOpen}
        editing={lotes.editing}
        form={lotes.form}
        errors={lotes.errors}
        guardando={lotes.guardando}
        clienteOptions={lotes.clienteOptions}
        tipoPrendaOptions={lotes.tipoPrendaOptions}
        tallaOptions={lotes.tallaOptions}
        colorOptions={lotes.colorOptions}
        subiendoFicha={lotes.subiendoFicha}
        archivosPendientes={lotes.archivosPendientes}
        desglose={lotes.desglose}
        onCambiarDesglose={lotes.onCambiarDesglose}
        onSubirFicha={lotes.subirFicha}
        onQuitarFicha={lotes.quitarFicha}
        onSeleccionarArchivoPendiente={lotes.seleccionarArchivoPendiente}
        onQuitarArchivoPendiente={lotes.quitarArchivoPendiente}
        onChange={lotes.setField}
        onClose={lotes.closeModal}
        onSave={handleSave}
      />

      <LoteDetalleModal
        lote={detalleVigente}
        nombreCliente={lotes.nombreCliente}
        subiendoFicha={lotes.subiendoFicha}
        desglose={lotes.desglose}
        tallaOptions={lotes.tallaOptions}
        colorOptions={lotes.colorOptions}
        onSubirFicha={lotes.subirFicha}
        onQuitarFicha={lotes.quitarFicha}
        onGuardarDesglose={lotes.guardarDesglose}
        onClose={lotes.cerrarDetalle}
        onEditar={(lote) => {
          lotes.cerrarDetalle();
          lotes.abrirEditar(lote);
        }}
      />

      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono={activando ? "exito" : "advertencia"}
        title={activando ? "¿Reactivar lote?" : "¿Desactivar lote?"}
        description={
          activando
            ? `El lote ${objetivoEstado?.codigo_lote} vuelve a ofrecerse y podrá usarse en órdenes de producción.`
            : `El lote ${objetivoEstado?.codigo_lote} dejará de ofrecerse al crear órdenes, pero conserva su historia.`
        }
        confirmLabel={activando ? "Reactivar" : "Desactivar"}
        loading={lotes.procesando}
        onCancel={() => lotes.setEstadoTarget(null)}
        onConfirm={() => lotes.cambiarEstado(objetivoEstado, activando ? 1 : 0)}
      />

      <ConfirmDialog
        open={Boolean(lotes.deleteTarget)}
        title="¿Eliminar lote?"
        description={`Se eliminará el lote ${lotes.deleteTarget?.codigo_lote || ""}. Si tiene órdenes de producción, el sistema lo inactiva en lugar de borrarlo.`}
        loading={lotes.procesando}
        onCancel={() => lotes.setDeleteTarget(null)}
        onConfirm={() => lotes.eliminar(lotes.deleteTarget)}
      />
    </div>
  );
}
