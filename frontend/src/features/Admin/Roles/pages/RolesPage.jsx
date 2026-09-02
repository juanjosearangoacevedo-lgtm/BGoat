import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataList } from "@/shared/components/DataList";
import { ExportMenu } from "@/shared/components/ExportMenu";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { TablePagination } from "@/shared/components/TablePagination";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { MODOS, useViewMode } from "@/shared/hooks/useViewMode";
import { formatFecha } from "@/shared/utils/formatters";
import { RolDetalleModal } from "../components/RolDetalleModal";
import { RolFormModal } from "../components/RolFormModal";
import { RolesSummary } from "../components/RolesSummary";
import { RolesTable, columnasRoles } from "../components/RolesTable";
import { useRolesPage } from "../hooks/useRolesPage";

/**
 * Modulo Roles.
 * Es tambien la pantalla donde se administran los permisos: el formulario de
 * rol incluye la matriz de `rol_permiso`, asi que no hay dos sitios donde
 * configurar lo mismo.
 */
export function RolesPage() {
  const roles = useRolesPage();
  const { lista } = roles;
  const vista = useViewMode("roles", MODOS.TABLA, [MODOS.TABLA, MODOS.LISTA]);

  /**
   * El backend no deja inactivar un rol que tenga usuarios activos.
   * Se avisa antes de pedirlo para no mostrar un error despues del clic.
   */
  const pedirCambioEstado = (rol) => {
    const activo = String(rol.estado).toUpperCase() === "ACTIVO";
    const enUso = Number(rol.usuarios_activos || 0);

    if (activo && enUso > 0) {
      toast.error(`No se puede desactivar: ${enUso} usuario(s) activo(s) tienen el rol ${rol.nombre}`);
      return;
    }
    roles.setEstadoTarget(rol);
  };

  const manejadores = {
    onDetalle: roles.verDetalle,
    onEdit: roles.abrirEditar,
    onToggleEstado: pedirCambioEstado,
    onDelete: roles.setDeleteTarget,
  };

  const columnas = columnasRoles(manejadores);

  const objetivoEstado = roles.estadoTarget;
  const activando = objetivoEstado && String(objetivoEstado.estado).toUpperCase() !== "ACTIVO";
  const hayBusqueda = lista.hayFiltros || Boolean(roles.search);

  const vacio = {
    icon: Shield,
    title: hayBusqueda ? "Sin resultados" : "No hay roles cargados",
    description: hayBusqueda
      ? "Ningun rol coincide con la busqueda o los filtros aplicados."
      : "Crea el primer rol y marca en el mismo formulario lo que puede hacer.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          roles.setSearch("");
        }}
      >
        Limpiar busqueda y filtros
      </Button>
    ) : (
      <Button onClick={roles.abrirCrear} className="bg-[#433A9B] text-white hover:bg-[#433A9B]/90">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo rol
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={roles.loading}
      label="roles"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Roles y permisos" subtitle={`${roles.total} roles registrados`}>
        <Button
          onClick={roles.abrirCrear}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo rol
        </Button>
      </PageHeader>

      {roles.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {roles.error}
        </div>
      )}

      <RolesSummary resumen={roles.resumen} />

      <FilterBar
        search={roles.search}
        onSearch={roles.setSearch}
        searchPlaceholder="Buscar rol por nombre o descripcion..."
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
              todos={roles.items}
              archivo="roles"
              label="roles"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA ? (
        <RolesTable
          columnas={columnas}
          roles={lista.visibles}
          loading={roles.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      ) : (
        <DataList
          items={lista.visibles}
          rowKey="id_rol"
          loading={roles.loading}
          empty={vacio}
          footer={paginacion}
          onClick={roles.verDetalle}
          avatar={() => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#433A9B] to-[#5a4fb8] text-white">
              <Shield className="h-4 w-4" />
            </div>
          )}
          primario={(rol) => rol.nombre}
          secundario={(rol) => rol.descripcion || "Sin descripcion"}
          meta={(rol) => [
            { label: "Permisos", value: rol.total_permisos ?? 0 },
            { label: "Usuarios activos", value: rol.usuarios_activos ?? 0 },
            { label: "Creado", value: formatFecha(rol.fecha_creacion) },
          ]}
          estado={(rol) => rol.estado}
          acciones={(rol) => (
            <RowActions
              acciones={accionesEstandar({
                fila: rol,
                ...manejadores,
                activo: String(rol.estado).toUpperCase() === "ACTIVO",
              })}
            />
          )}
        />
      )}

      <RolFormModal
        open={roles.modalOpen}
        editing={roles.editing}
        form={roles.form}
        errors={roles.errors}
        guardando={roles.guardandoRol}
        catalogo={roles.catalogo}
        seleccionados={roles.seleccionados}
        cargandoPermisos={roles.cargandoPermisos}
        onChange={roles.setField}
        onTogglePermiso={roles.alternarPermiso}
        onToggleModulo={roles.alternarModulo}
        onToggleTodos={roles.alternarTodos}
        onClose={roles.closeModal}
        onSave={roles.guardarRol}
      />

      <RolDetalleModal
        rol={roles.detalle}
        permisos={roles.permisosDetalle}
        onClose={roles.cerrarDetalle}
        onEditar={(rol) => {
          roles.cerrarDetalle();
          roles.abrirEditar(rol);
        }}
      />

      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono={activando ? "exito" : "advertencia"}
        title={activando ? "Activar rol?" : "Desactivar rol?"}
        description={
          activando
            ? `El rol ${objetivoEstado?.nombre} volvera a poder asignarse a usuarios.`
            : `El rol ${objetivoEstado?.nombre} dejara de poder asignarse, pero conserva sus permisos configurados.`
        }
        confirmLabel={activando ? "Activar" : "Desactivar"}
        loading={roles.procesando}
        onCancel={() => roles.setEstadoTarget(null)}
        onConfirm={() => roles.cambiarEstado(objetivoEstado)}
      />

      <ConfirmDialog
        open={Boolean(roles.deleteTarget)}
        title="Eliminar rol?"
        description={
          `Se eliminara el rol ${roles.deleteTarget?.nombre || ""} y sus permisos. ` +
          "No se puede eliminar un rol que tenga usuarios asignados."
        }
        loading={roles.procesando}
        onCancel={() => roles.setDeleteTarget(null)}
        onConfirm={() => roles.eliminar(roles.deleteTarget)}
      />
    </div>
  );
}
