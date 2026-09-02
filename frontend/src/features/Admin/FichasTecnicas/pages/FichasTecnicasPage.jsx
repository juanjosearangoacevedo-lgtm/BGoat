import { Plus, Shirt } from "lucide-react";
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
import { formatFecha, GUION } from "@/shared/utils/formatters";
import { FichaTecnicaCard } from "../components/FichaTecnicaCard";
import { FichaTecnicaDetalle } from "../components/FichaTecnicaDetalle";
import { FichaTecnicaFormModal } from "../components/FichaTecnicaFormModal";
import { FichasTecnicasTable, columnasFichas } from "../components/FichasTecnicasTable";
import { useFichasTecnicasPage } from "../hooks/useFichasTecnicasPage";

export function FichasTecnicasPage() {
  const fichas = useFichasTecnicasPage();
  const { lista } = fichas;
  const vista = useViewMode("fichas-tecnicas", MODOS.TARJETAS);

  const handleSave = () => {
    if (!fichas.validate()) return;
    fichas.guardar();
  };

  const manejadores = {
    onDetalle: fichas.abrirDetalle,
    onEdit: fichas.abrirEditar,
    onToggleEstado: fichas.setEstadoTarget,
    onDelete: fichas.setDeleteTarget,
  };

  const columnas = columnasFichas(manejadores);
  const objetivoEstado = fichas.estadoTarget;
  const activando = objetivoEstado && String(objetivoEstado.estado).toUpperCase() !== "VIGENTE";
  const hayBusqueda = lista.hayFiltros || Boolean(fichas.search);

  // El detalle de una ficha reemplaza el listado: trae sus tres tablas hijas.
  if (fichas.selected) {
    return (
      <FichaTecnicaDetalle
        ficha={fichas.selected}
        referencia={fichas.referenciaDe(fichas.selected.id_referencia)}
        operaciones={fichas.detalle.operaciones}
        materiales={fichas.detalle.materiales}
        medidas={fichas.detalle.medidas}
        onBack={fichas.cerrarDetalle}
      />
    );
  }

  const vacio = {
    icon: Shirt,
    title: hayBusqueda ? "Sin resultados" : "No hay fichas tecnicas",
    description: hayBusqueda
      ? "Ninguna ficha coincide con la busqueda o los filtros aplicados."
      : "Sin ficha tecnica no hay SAM, y sin SAM el sistema no puede calcular la meta de cada hora.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          fichas.setSearch("");
        }}
      >
        Limpiar busqueda y filtros
      </Button>
    ) : (
      <Button onClick={fichas.openCreate} className="bg-[#433A9B] text-white hover:bg-[#433A9B]/90">
        <Plus className="mr-2 h-4 w-4" />
        Nueva ficha tecnica
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={fichas.loading}
      label="fichas"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Fichas Tecnicas"
        subtitle={`${fichas.total} fichas · aqui vive el SAM de cada referencia`}
      >
        <Button
          onClick={fichas.openCreate}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Plus className="h-4 w-4" />
          Nueva ficha tecnica
        </Button>
      </PageHeader>

      {fichas.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fichas.error}
        </div>
      )}

      <StatsGrid
        columns={4}
        items={[
          { label: "Total fichas", value: fichas.resumen.total },
          { label: "Vigentes", value: fichas.resumen.vigentes, color: "#10b981" },
          { label: "Borradores", value: fichas.resumen.borradores, color: "#6b7280" },
          {
            label: "Sin SAM pactado",
            value: fichas.resumen.sinSam,
            color: fichas.resumen.sinSam > 0 ? "#f59e0b" : "#6b7280",
            hint: "No pueden calcular meta horaria",
          },
        ]}
      />

      <FilterBar
        search={fichas.search}
        onSearch={fichas.setSearch}
        searchPlaceholder="Buscar por codigo, descripcion o material..."
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
              todos={fichas.items}
              archivo="fichas-tecnicas"
              label="fichas"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA && (
        <FichasTecnicasTable
          columnas={columnas}
          fichas={lista.visibles}
          loading={fichas.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      )}

      {vista.modo === MODOS.LISTA && (
        <DataList
          items={lista.visibles}
          rowKey="id_ficha_tecnica"
          loading={fichas.loading}
          empty={vacio}
          footer={paginacion}
          onClick={fichas.abrirDetalle}
          avatar={() => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#433A9B]/10 text-[#433A9B]">
              <Shirt className="h-4 w-4" />
            </div>
          )}
          primario={(ficha) => `${ficha.codigo_ficha} · v${ficha.version}`}
          secundario={(ficha) => ficha.descripcion || "Sin descripcion"}
          meta={(ficha) => [
            { label: "Referencia", value: ficha.codigo_referencia || GUION },
            {
              label: "SAM",
              value: Number(ficha.sam_pactado || 0) > 0 ? `${ficha.sam_pactado} min` : "Sin SAM",
            },
            { label: "Vigencia", value: formatFecha(ficha.fecha_vigencia) },
          ]}
          estado={(ficha) => ficha.estado}
          acciones={(ficha) => (
            <RowActions
              acciones={accionesEstandar({
                fila: ficha,
                ...manejadores,
                activo: String(ficha.estado).toUpperCase() === "VIGENTE",
              })}
            />
          )}
        />
      )}

      {vista.modo === MODOS.TARJETAS && (
        <>
          {fichas.loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, indice) => (
                <div
                  key={indice}
                  className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : lista.visibles.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <EmptyState {...vacio} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {lista.visibles.map((ficha) => (
                <FichaTecnicaCard
                  key={ficha.id_ficha_tecnica}
                  ficha={ficha}
                  referencia={fichas.referenciaDe(ficha.id_referencia)}
                  onSelect={fichas.abrirDetalle}
                  onEdit={fichas.abrirEditar}
                  onToggleEstado={fichas.setEstadoTarget}
                  onDelete={fichas.setDeleteTarget}
                />
              ))}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {paginacion}
          </div>
        </>
      )}

      <FichaTecnicaFormModal
        open={fichas.modalOpen}
        editing={fichas.editing}
        form={fichas.form}
        errors={fichas.errors}
        guardando={fichas.guardando}
        referenciaOptions={fichas.referenciaOptions}
        onChange={fichas.setField}
        onClose={fichas.closeModal}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono={activando ? "exito" : "advertencia"}
        title={activando ? "Marcar ficha como vigente?" : "Inactivar ficha?"}
        description={
          activando
            ? `La ficha ${objetivoEstado?.codigo_ficha} pasara a VIGENTE y podra usarse en nuevas ordenes.`
            : `La ficha ${objetivoEstado?.codigo_ficha} pasara a INACTIVA. Las ordenes que ya la usan no se modifican.`
        }
        confirmLabel={activando ? "Marcar vigente" : "Inactivar"}
        loading={fichas.procesando}
        onCancel={() => fichas.setEstadoTarget(null)}
        onConfirm={() => fichas.alternarVigencia(objetivoEstado)}
      />

      <ConfirmDialog
        open={Boolean(fichas.deleteTarget)}
        title="Eliminar ficha tecnica?"
        description={
          `Se eliminara la ficha ${fichas.deleteTarget?.codigo_ficha || ""}. ` +
          "Si tiene ordenes asociadas, el sistema la inactiva en lugar de borrarla."
        }
        loading={fichas.procesando}
        onCancel={() => fichas.setDeleteTarget(null)}
        onConfirm={() => fichas.eliminar(fichas.deleteTarget)}
      />
    </div>
  );
}
