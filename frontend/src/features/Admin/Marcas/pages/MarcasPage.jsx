import { Plus, Tag } from "lucide-react";
import { Button } from "@/shared/components/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataList } from "@/shared/components/DataList";
import { EmptyState } from "@/shared/components/EmptyState";
import { ExportMenu } from "@/shared/components/ExportMenu";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatsGrid } from "@/shared/components/StatsGrid";
import { TablePagination } from "@/shared/components/TablePagination";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { MODOS, useViewMode } from "@/shared/hooks/useViewMode";
import { formatFecha, iniciales } from "@/shared/utils/formatters";
import { MarcaCard } from "../components/MarcaCard";
import { MarcaDetalleModal } from "../components/MarcaDetalleModal";
import { MarcaFormModal } from "../components/MarcaFormModal";
import { MarcasTable, columnasMarcas } from "../components/MarcasTable";
import { useMarcasPage } from "../hooks/useMarcasPage";

/** Modulo Marcas: tarjetas, lista compacta o tabla. */
export function MarcasPage() {
  const marcas = useMarcasPage();
  const { lista } = marcas;
  const vista = useViewMode("marcas", MODOS.TARJETAS);

  const handleSave = () => {
    if (!marcas.validate()) return;
    marcas.guardar();
  };

  const manejadores = {
    onDetalle: marcas.verDetalle,
    onEdit: marcas.openEdit,
    onToggleEstado: marcas.setEstadoTarget,
    onDelete: marcas.setDeleteTarget,
  };

  const columnas = columnasMarcas(manejadores);
  const objetivoEstado = marcas.estadoTarget;
  const activando = objetivoEstado && String(objetivoEstado.estado).toUpperCase() !== "ACTIVO";
  const hayBusqueda = lista.hayFiltros || Boolean(marcas.search);

  const vacio = {
    icon: Tag,
    title: hayBusqueda ? "Sin resultados" : "No hay marcas cargadas",
    description: hayBusqueda
      ? "Ninguna marca coincide con la busqueda o los filtros aplicados."
      : "Registra la primera marca: los lotes y las referencias cuelgan de ella.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          marcas.setSearch("");
        }}
      >
        Limpiar busqueda y filtros
      </Button>
    ) : (
      <Button onClick={marcas.openCreate} className="bg-[#433A9B] text-white hover:bg-[#433A9B]/90">
        <Plus className="mr-2 h-4 w-4" />
        Nueva marca
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={marcas.loading}
      label="marcas"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Marcas" subtitle={`${marcas.total} marcas registradas`}>
        <Button
          onClick={marcas.openCreate}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Plus className="h-4 w-4" />
          Nueva marca
        </Button>
      </PageHeader>

      {marcas.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {marcas.error}
        </div>
      )}

      <StatsGrid
        columns={4}
        items={[
          { label: "Total marcas", value: marcas.resumen.total },
          { label: "Activas", value: marcas.resumen.activas, color: "#10b981" },
          { label: "Inactivas", value: marcas.resumen.inactivas, color: "#6b7280" },
          { label: "Con descripcion", value: marcas.resumen.documentadas, color: "#F39A3D" },
        ]}
      />

      <FilterBar
        search={marcas.search}
        onSearch={marcas.setSearch}
        searchPlaceholder="Buscar marca por nombre o descripcion..."
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
              todos={marcas.items}
              archivo="marcas"
              label="marcas"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA && (
        <MarcasTable
          columnas={columnas}
          marcas={lista.visibles}
          loading={marcas.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      )}

      {vista.modo === MODOS.LISTA && (
        <DataList
          items={lista.visibles}
          rowKey="id_marca"
          loading={marcas.loading}
          empty={vacio}
          footer={paginacion}
          onClick={marcas.verDetalle}
          avatar={(marca) => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#433A9B] to-[#5a4fb8] text-xs font-bold text-white">
              {iniciales(marca.nombre)}
            </div>
          )}
          primario={(marca) => marca.nombre}
          secundario={(marca) => marca.descripcion || "Sin descripcion"}
          meta={(marca) => [{ label: "Registrada", value: formatFecha(marca.fecha_creacion) }]}
          estado={(marca) => marca.estado}
          acciones={(marca) => <RowActions acciones={accionesEstandar({ fila: marca, ...manejadores })} />}
        />
      )}

      {vista.modo === MODOS.TARJETAS && (
        <>
          {marcas.loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, indice) => (
                <div
                  key={indice}
                  className="h-56 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : lista.visibles.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <EmptyState {...vacio} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {lista.visibles.map((marca, indice) => (
                <MarcaCard key={marca.id_marca} marca={marca} index={indice} {...manejadores} />
              ))}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {paginacion}
          </div>
        </>
      )}

      <MarcaFormModal
        open={marcas.modalOpen}
        editing={marcas.editing}
        form={marcas.form}
        errors={marcas.errors}
        guardando={marcas.guardando}
        onChange={marcas.setField}
        onClose={marcas.closeModal}
        onSave={handleSave}
      />

      <MarcaDetalleModal
        marca={marcas.detalle}
        onClose={marcas.cerrarDetalle}
        onEditar={(marca) => {
          marcas.cerrarDetalle();
          marcas.openEdit(marca);
        }}
      />

      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono={activando ? "exito" : "advertencia"}
        title={activando ? "Activar marca?" : "Desactivar marca?"}
        description={
          activando
            ? `La marca ${objetivoEstado?.nombre} volvera a ofrecerse al crear lotes y referencias.`
            : `La marca ${objetivoEstado?.nombre} dejara de ofrecerse en los formularios, pero conserva su historia.`
        }
        confirmLabel={activando ? "Activar" : "Desactivar"}
        loading={marcas.procesando}
        onCancel={() => marcas.setEstadoTarget(null)}
        onConfirm={() => marcas.cambiarEstado(objetivoEstado)}
      />

      <ConfirmDialog
        open={Boolean(marcas.deleteTarget)}
        title="Eliminar marca?"
        description={`Se eliminara la marca ${marcas.deleteTarget?.nombre || ""}. Si tiene referencias o lotes, el sistema la inactiva en lugar de borrarla.`}
        loading={marcas.procesando}
        onCancel={() => marcas.setDeleteTarget(null)}
        onConfirm={() => marcas.eliminar(marcas.deleteTarget)}
      />
    </div>
  );
}
