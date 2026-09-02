import { Factory, Plus } from "lucide-react";
import { Button } from "@/shared/components/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataList } from "@/shared/components/DataList";
import { EmptyState } from "@/shared/components/EmptyState";
import { ExportMenu } from "@/shared/components/ExportMenu";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { TablePagination } from "@/shared/components/TablePagination";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { MODOS, useViewMode } from "@/shared/hooks/useViewMode";
import { formatNumero } from "@/shared/utils/formatters";
import { ModuloCard } from "../components/ModuloCard";
import { ModuloDetallePanel } from "../components/ModuloDetallePanel";
import { ModuloFormModal } from "../components/ModuloFormModal";
import { ModulosKpis } from "../components/ModulosKpis";
import { ModulosTable, columnasModulos } from "../components/ModulosTable";
import { useModulosPage } from "../hooks/useModulosPage";

export function ModulosPage() {
  const modulos = useModulosPage();
  const { lista } = modulos;
  const vista = useViewMode("modulos", MODOS.TARJETAS);

  const handleSave = () => {
    if (!modulos.validate()) return;
    modulos.guardar();
  };

  const manejadores = {
    onDetalle: modulos.setSelected,
    onEdit: modulos.openEdit,
    onToggleEstado: modulos.setEstadoTarget,
    onDelete: modulos.setDeleteTarget,
  };

  const columnas = columnasModulos(manejadores);
  const objetivoEstado = modulos.estadoTarget;
  const activando = objetivoEstado && String(objetivoEstado.estado).toUpperCase() !== "ACTIVO";
  const hayBusqueda = lista.hayFiltros || Boolean(modulos.search);

  const vacio = {
    icon: Factory,
    title: hayBusqueda ? "Sin resultados" : "No hay modulos configurados",
    description: hayBusqueda
      ? "Ningun modulo coincide con la busqueda o los filtros aplicados."
      : "Configura los modulos de la planta para poder asignarles ordenes y capturar produccion.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          modulos.setSearch("");
        }}
      >
        Limpiar busqueda y filtros
      </Button>
    ) : (
      <Button onClick={modulos.openCreate} className="bg-[#433A9B] text-white hover:bg-[#433A9B]/90">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo modulo
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={modulos.loading}
      label="modulos"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Modulos y Empleados" subtitle="Tablero de control de la planta de produccion">
        <Button
          onClick={modulos.openCreate}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo modulo
        </Button>
      </PageHeader>

      {modulos.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {modulos.error}
        </div>
      )}

      <ModulosKpis totals={modulos.totals} />

      <FilterBar
        search={modulos.search}
        onSearch={modulos.setSearch}
        searchPlaceholder="Buscar por codigo, nombre o ubicacion..."
        definiciones={lista.definiciones}
        filtros={lista.filtros}
        onFiltro={lista.setFiltro}
        filtrosActivos={lista.filtrosActivos}
        onLimpiar={lista.limpiarFiltros}
        acciones={
          <>
            <ViewToggle modo={vista.modo} onChange={vista.setModo} />
            <ExportMenu
              columnas={columnas}
              filtrados={lista.filtrados}
              todos={modulos.modulos}
              archivo="modulos"
              label="modulos"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA && (
        <ModulosTable
          columnas={columnas}
          modulos={lista.visibles}
          loading={modulos.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      )}

      {vista.modo === MODOS.LISTA && (
        <DataList
          items={lista.visibles}
          rowKey="id_modulo"
          loading={modulos.loading}
          empty={vacio}
          footer={paginacion}
          onClick={modulos.setSelected}
          avatar={() => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#433A9B]/10 text-[#433A9B]">
              <Factory className="h-4 w-4" />
            </div>
          )}
          primario={(modulo) => modulo.nombre}
          secundario={(modulo) => `${modulo.codigo} · ${modulo.ubicacion || "Sin ubicacion"}`}
          meta={(modulo) => [
            {
              label: "Personal",
              value: `${Math.round(Number(modulo.promedio_personas || 0))}/${Number(
                modulo.capacidad_operarios || 0,
              )}`,
            },
            { label: "Producido hoy", value: formatNumero(modulo.unidades_producidas) },
            { label: "Eficiencia", value: `${Math.round(Number(modulo.eficiencia || 0))}%` },
          ]}
          estado={(modulo) => modulo.estado}
          acciones={(modulo) => <RowActions acciones={accionesEstandar({ fila: modulo, ...manejadores })} />}
        />
      )}

      {vista.modo === MODOS.TARJETAS && (
        <>
          {modulos.loading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, indice) => (
                <div
                  key={indice}
                  className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : lista.visibles.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <EmptyState {...vacio} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {lista.visibles.map((modulo) => (
                <ModuloCard
                  key={modulo.id_modulo}
                  modulo={modulo}
                  onSelect={modulos.setSelected}
                  onEdit={modulos.openEdit}
                  onToggleEstado={modulos.setEstadoTarget}
                  onDelete={modulos.setDeleteTarget}
                />
              ))}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {paginacion}
          </div>
        </>
      )}

      <ModuloFormModal
        open={modulos.modalOpen}
        editing={modulos.editing}
        form={modulos.form}
        errors={modulos.errors}
        guardando={modulos.guardando}
        onChange={modulos.setField}
        onClose={modulos.closeModal}
        onSave={handleSave}
      />

      <ModuloDetallePanel modulo={modulos.selected} onClose={() => modulos.setSelected(null)} />

      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono={activando ? "exito" : "advertencia"}
        title={activando ? "Activar modulo?" : "Desactivar modulo?"}
        description={
          activando
            ? `El modulo ${objetivoEstado?.codigo} volvera a recibir ordenes de produccion.`
            : `El modulo ${objetivoEstado?.codigo} dejara de ofrecerse al crear ordenes, pero conserva su historia.`
        }
        confirmLabel={activando ? "Activar" : "Desactivar"}
        loading={modulos.procesando}
        onCancel={() => modulos.setEstadoTarget(null)}
        onConfirm={() => modulos.cambiarEstado(objetivoEstado)}
      />

      <ConfirmDialog
        open={Boolean(modulos.deleteTarget)}
        title="Eliminar modulo?"
        description={
          `Se eliminara el modulo ${modulos.deleteTarget?.codigo || ""}. ` +
          "No se puede eliminar un modulo con ordenes de produccion asociadas."
        }
        loading={modulos.procesando}
        onCancel={() => modulos.setDeleteTarget(null)}
        onConfirm={() => modulos.eliminar(modulos.deleteTarget)}
      />
    </div>
  );
}
