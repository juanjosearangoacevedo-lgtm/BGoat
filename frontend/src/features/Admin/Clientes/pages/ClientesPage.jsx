import { Building2, Plus } from "lucide-react";
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
import { documento, iniciales } from "@/shared/utils/formatters";
import { ClienteCard } from "../components/ClienteCard";
import { ClienteDetalleModal } from "../components/ClienteDetalleModal";
import { ClienteFormModal } from "../components/ClienteFormModal";
import { ClientesTable, columnasClientes } from "../components/ClientesTable";
import { useClientesPage } from "../hooks/useClientesPage";

/** Modulo Clientes: tarjetas, lista compacta o tabla, segun prefiera el usuario. */
export function ClientesPage() {
  const clientes = useClientesPage();
  const { lista } = clientes;
  const vista = useViewMode("clientes", MODOS.TARJETAS);

  const handleSave = () => {
    if (!clientes.validate()) return;
    clientes.guardar();
  };

  const manejadores = {
    onDetalle: clientes.verDetalle,
    onEdit: clientes.openEdit,
    onToggleEstado: clientes.setEstadoTarget,
    onDelete: clientes.setDeleteTarget,
  };

  const columnas = columnasClientes(manejadores);
  const objetivoEstado = clientes.estadoTarget;
  const activando = objetivoEstado && String(objetivoEstado.estado).toUpperCase() !== "ACTIVO";
  const hayBusqueda = lista.hayFiltros || Boolean(clientes.search);

  const vacio = {
    icon: Building2,
    title: hayBusqueda ? "Sin resultados" : "No hay clientes cargados",
    description: hayBusqueda
      ? "Ningun cliente coincide con la busqueda o los filtros aplicados."
      : "Registra el primer cliente para poder cargarle lotes.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          clientes.setSearch("");
        }}
      >
        Limpiar busqueda y filtros
      </Button>
    ) : (
      <Button onClick={clientes.openCreate} className="bg-[#D08E10] text-white hover:bg-[#B67F14]">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo cliente
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={clientes.loading}
      label="clientes"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Clientes" subtitle={`${clientes.total} clientes registrados`}>
        <Button
          onClick={clientes.openCreate}
          className="h-10 gap-2 rounded-xl bg-[#D08E10] px-5 text-white hover:bg-[#B67F14]"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </PageHeader>

      {clientes.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {clientes.error}
        </div>
      )}

      <StatsGrid
        columns={4}
        items={[
          { label: "Total clientes", value: clientes.resumen.total },
          { label: "Activos", value: clientes.resumen.activos, color: "#10b981" },
          { label: "Con datos fiscales", value: clientes.resumen.conDatos, color: "#D08E10" },
          { label: "Sin datos fiscales", value: clientes.resumen.sinDatos, color: "#6b7280" },
        ]}
      />

      <FilterBar
        search={clientes.search}
        onSearch={clientes.setSearch}
        searchPlaceholder="Buscar por nombre, documento o correo..."
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
              todos={lista.filtrados}
              archivo="clientes"
              label="clientes"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA && (
        <ClientesTable
          columnas={columnas}
          clientes={lista.visibles}
          loading={clientes.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      )}

      {vista.modo === MODOS.LISTA && (
        <DataList
          items={lista.visibles}
          rowKey="id_cliente"
          loading={clientes.loading}
          empty={vacio}
          footer={paginacion}
          onClick={clientes.verDetalle}
          avatar={(cliente) => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F4C3F]/10 text-xs font-bold text-[#0F4C3F]">
              {iniciales(cliente.nombre)}
            </div>
          )}
          primario={(cliente) => cliente.nombre}
          secundario={(cliente) => documento(cliente)}
          meta={(cliente) => [
            { label: "Correo", value: cliente.correo || "—" },
            { label: "Telefono", value: cliente.telefono || "—" },
            { label: "Direccion", value: cliente.direccion || "—" },
          ]}
          estado={(cliente) => cliente.estado}
          acciones={(cliente) => (
            <RowActions acciones={accionesEstandar({ fila: cliente, ...manejadores })} />
          )}
        />
      )}

      {vista.modo === MODOS.TARJETAS && (
        <>
          {clientes.loading ? (
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
              {lista.visibles.map((cliente, indice) => (
                <ClienteCard
                  key={cliente.id_cliente}
                  cliente={cliente}
                  index={indice}
                  {...manejadores}
                />
              ))}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {paginacion}
          </div>
        </>
      )}

      <ClienteFormModal
        open={clientes.modalOpen}
        editing={clientes.editing}
        form={clientes.form}
        errors={clientes.errors}
        guardando={clientes.guardando}
        onChange={clientes.setField}
        onClose={clientes.closeModal}
        onSave={handleSave}
      />

      <ClienteDetalleModal
        cliente={clientes.detalle}
        onClose={clientes.cerrarDetalle}
        onEditar={(cliente) => {
          clientes.cerrarDetalle();
          clientes.openEdit(cliente);
        }}
      />

      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono={activando ? "exito" : "advertencia"}
        title={activando ? "Activar cliente?" : "Desactivar cliente?"}
        description={
          activando
            ? `${objetivoEstado?.nombre} volvera a aparecer al crear lotes y al iniciar la jornada.`
            : `${objetivoEstado?.nombre} dejara de ofrecerse en los formularios, pero conserva su historia.`
        }
        confirmLabel={activando ? "Activar" : "Desactivar"}
        loading={clientes.procesando}
        onCancel={() => clientes.setEstadoTarget(null)}
        onConfirm={() => clientes.cambiarEstado(objetivoEstado)}
      />

      <ConfirmDialog
        open={Boolean(clientes.deleteTarget)}
        title="Eliminar cliente?"
        description={`Se eliminara ${clientes.deleteTarget?.nombre}. Si tiene lotes registrados, el sistema lo inactiva en lugar de borrarlo.`}
        loading={clientes.procesando}
        onCancel={() => clientes.setDeleteTarget(null)}
        onConfirm={() => clientes.eliminar(clientes.deleteTarget)}
      />
    </div>
  );
}
