import { Plus, Users } from "lucide-react";
import { Button } from "@/shared/components/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataList } from "@/shared/components/DataList";
import { EliminarDialog } from "@/shared/components/EliminarDialog";
import { ExportMenu } from "@/shared/components/ExportMenu";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { TablePagination } from "@/shared/components/TablePagination";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { useAuth } from "@/shared/contexts/AuthContext";
import { MODOS, useViewMode } from "@/shared/hooks/useViewMode";
import { endpoints } from "@/shared/services/endpoints";
import { documento, formatFechaHora, iniciales, nombreCompleto } from "@/shared/utils/formatters";
import { UsuarioDetalleModal } from "../components/UsuarioDetalleModal";
import { UsuarioFormModal } from "../components/UsuarioFormModal";
import { UsuariosSummary } from "../components/UsuariosSummary";
import { UsuariosTable, columnasUsuarios } from "../components/UsuariosTable";
import { useUsuariosPage } from "../hooks/useUsuariosPage";

export function UsuariosPage() {
  const usuarios = useUsuariosPage();
  const { lista } = usuarios;
  const vista = useViewMode("usuarios", MODOS.TABLA, [MODOS.TABLA, MODOS.LISTA]);
  const { usuario: sesion } = useAuth();

  /** Nadie puede inactivarse a si mismo: ni el backend lo deja ni la pantalla lo ofrece. */
  const esYo = (usuario) => Number(usuario?.id_usuario) === Number(sesion?.id_usuario);

  const handleSave = () => {
    if (!usuarios.validate()) return;
    usuarios.guardar();
  };

  const manejadores = {
    onDetalle: usuarios.verDetalle,
    onEdit: usuarios.openEdit,
    onToggleEstado: usuarios.setEstadoTarget,
    onDelete: usuarios.setDeleteTarget,
  };

  const columnas = columnasUsuarios({ roleName: usuarios.roleName, esYo, ...manejadores });

  const objetivoEstado = usuarios.estadoTarget;
  const hayBusqueda = lista.hayFiltros || Boolean(usuarios.search);

  const vacio = {
    icon: Users,
    title: hayBusqueda ? "Sin resultados" : "No hay usuarios cargados",
    description: hayBusqueda
      ? "Ningún usuario coincide con la búsqueda o los filtros aplicados."
      : "Crea el primer usuario y asignale un rol para que pueda entrar al panel.",
    action: hayBusqueda ? (
      <Button
        variant="outline"
        onClick={() => {
          lista.limpiarFiltros();
          usuarios.setSearch("");
        }}
      >
        Limpiar búsqueda y filtros
      </Button>
    ) : (
      <Button onClick={usuarios.openCreate} className="bg-dorado text-white hover:bg-dorado-hover">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo usuario
      </Button>
    ),
  };

  const paginacion = (
    <TablePagination
      page={lista.page}
      totalPages={lista.totalPages}
      total={lista.total}
      pageSize={lista.pageSize}
      loading={usuarios.loading}
      label="usuarios"
      onPageChange={lista.setPage}
      onPageSizeChange={lista.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Usuarios" subtitle={`${usuarios.total} usuarios registrados`}>
        <Button
          onClick={usuarios.openCreate}
          className="h-10 gap-2 rounded-xl bg-dorado px-5 text-white hover:bg-dorado-hover"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </PageHeader>

      {usuarios.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {usuarios.error}
        </div>
      )}

      <UsuariosSummary resumen={usuarios.resumen} />

      <FilterBar
        search={usuarios.search}
        onSearch={usuarios.setSearch}
        searchPlaceholder="Buscar por nombre, correo o documento..."
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
              todos={usuarios.items}
              archivo="usuarios"
              label="usuarios"
            />
          </>
        }
      />

      {vista.modo === MODOS.TABLA ? (
        <UsuariosTable
          columnas={columnas}
          users={lista.visibles}
          loading={usuarios.loading}
          orden={lista.orden}
          onOrdenar={lista.ordenarPor}
          empty={vacio}
          footer={paginacion}
        />
      ) : (
        <DataList
          items={lista.visibles}
          rowKey="id_usuario"
          loading={usuarios.loading}
          empty={vacio}
          footer={paginacion}
          onClick={usuarios.verDetalle}
          avatar={(usuario) => (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-marca to-marca text-xs font-bold text-white">
              {iniciales(nombreCompleto(usuario))}
            </div>
          )}
          primario={(usuario) => nombreCompleto(usuario)}
          secundario={(usuario) => usuario.correo}
          meta={(usuario) => [
            { label: "Documento", value: documento(usuario) },
            {
              label: "Rol",
              value: usuario.nombre_rol || usuarios.roleName?.(usuario.id_rol) || usuario.id_rol,
            },
            { label: "Último acceso", value: formatFechaHora(usuario.ultimo_acceso) },
          ]}
          estado={(usuario) => usuario.estado}
          acciones={(usuario) => (
            <RowActions
              acciones={accionesEstandar({
                fila: usuario,
                ...manejadores,
                onDelete: esYo(usuario) ? undefined : manejadores.onDelete,
                activo: String(usuario.estado).toUpperCase() === "ACTIVO",
              })}
            />
          )}
        />
      )}

      <UsuarioFormModal
        open={usuarios.modalOpen}
        editing={usuarios.editing}
        form={usuarios.form}
        errors={usuarios.errors}
        guardando={usuarios.guardando}
        roleOptions={usuarios.roleOptions}
        editandoseASiMismo={Boolean(usuarios.editing) && esYo(usuarios.editing)}
        onChange={usuarios.setField}
        onClose={usuarios.closeModal}
        onSave={handleSave}
      />

      <UsuarioDetalleModal
        usuario={usuarios.detalle}
        roleName={usuarios.roleName}
        onClose={usuarios.cerrarDetalle}
        onEditar={(usuario) => {
          usuarios.cerrarDetalle();
          usuarios.openEdit(usuario);
        }}
      />

      {/* "Activar" es lo que queda en un usuario inactivo o bloqueado; eliminar lo inactiva (ver EliminarDialog). */}
      <ConfirmDialog
        open={Boolean(objetivoEstado)}
        tono="exito"
        title="¿Activar usuario?"
        description={`${nombreCompleto(objetivoEstado)} podrá volver a iniciar sesión. Si estaba bloqueado, se limpian los intentos fallidos.`}
        confirmLabel="Activar"
        loading={usuarios.procesando}
        onCancel={() => usuarios.setEstadoTarget(null)}
        onConfirm={() => usuarios.cambiarEstado(objetivoEstado)}
      />

      <EliminarDialog
        recurso={endpoints.usuarios}
        objetivo={usuarios.deleteTarget}
        idField="id_usuario"
        entidad="usuario"
        nombre={usuarios.deleteTarget ? nombreCompleto(usuarios.deleteTarget) : ""}
        loading={usuarios.procesando}
        onCancel={() => usuarios.setDeleteTarget(null)}
        onConfirm={() => usuarios.eliminar(usuarios.deleteTarget)}
      />
    </div>
  );
}
