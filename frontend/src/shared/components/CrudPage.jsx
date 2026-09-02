import { useMemo } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "./button";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataList } from "./DataList";
import { DataTable } from "./DataTable";
import { DetailModal } from "./DetailModal";
import { ExportMenu } from "./ExportMenu";
import { FilterBar } from "./FilterBar";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { PageHeader } from "./PageHeader";
import { RowActions, accionesEstandar } from "./RowActions";
import { StatusBadge } from "./StatusBadge";
import { TablePagination } from "./TablePagination";
import { ViewToggle } from "./ViewToggle";
import { useCrudResource } from "../hooks/useCrudResource";
import { useListaAdmin } from "../hooks/useListaAdmin";
import { MODOS, useViewMode } from "../hooks/useViewMode";

/**
 * Pagina CRUD estandar, construida a partir de una configuracion.
 *
 * Un modulo declara sus columnas y sus campos, y de ahi salen listado con
 * orden, filtros, paginacion, detalle, activar/desactivar, exportacion y
 * formulario validado. Los modulos con diseno propio (Clientes, Marcas,
 * Lotes, Ordenes) arman lo mismo con las piezas sueltas de `shared`.
 *
 *   columnas: [{ key, header, align, render(fila), sortable, tipo: "estado" }]
 *   campos:   [{ name, label, type, options, placeholder, ancho, required,
 *               minLength, maxLength, min, max, patron, hint }]
 *   filtrosLista: [{ clave, label, tipo, opciones }]  -> filtros en pantalla
 *   filtros:      { estado: "ACTIVO" }                -> filtros del query
 */
const ESTADOS_ACTIVOS = ["ACTIVO", "ACTIVA", "VIGENTE"];

function esActivo(fila) {
  return ESTADOS_ACTIVOS.includes(String(fila?.estado || "").toUpperCase());
}

export function CrudPage({
  titulo,
  subtitulo,
  recurso,
  idField,
  columnas = [],
  campos = [],
  emptyForm = {},
  required = [],
  esquema = null,
  etiquetaNuevo = "Nuevo",
  nombreRegistro = (fila) => fila?.nombre || "el registro",
  transformarPayload = null,
  filtros = {},
  filtrosLista = [],
  ordenInicial = null,
  pageSize = 10,
  busquedaPlaceholder = "Buscar...",
  emptyIcon,
  emptyTitle,
  emptyDescription,
  extraAcciones = null,
  detalleSecciones = null,
  lista = null,
  vistas = [MODOS.TABLA, MODOS.LISTA],
  permiteEstado = undefined,
}) {
  // Las etiquetas de los campos alimentan los mensajes de "es obligatorio".
  const etiquetas = useMemo(
    () => Object.fromEntries(campos.map((campo) => [campo.name, campo.label])),
    [campos],
  );

  const crud = useCrudResource({
    recurso,
    idField,
    emptyForm,
    required,
    etiquetas,
    esquema,
    filtros,
    transformarPayload,
    nombreRegistro,
  });

  const conEstado =
    permiteEstado ?? Object.prototype.hasOwnProperty.call(emptyForm, "estado");

  const columnasDatos = useMemo(
    () =>
      columnas.map((columna) =>
        columna.tipo === "estado"
          ? {
              sortable: true,
              ...columna,
              render: (fila) => <StatusBadge status={fila[columna.key]} />,
              exportar: (fila) => fila[columna.key],
            }
          : { sortable: true, ...columna },
      ),
    [columnas],
  );

  const listaAdmin = useListaAdmin(crud.items, {
    filtros: filtrosLista,
    ordenInicial,
    pageSize,
    columnas: columnasDatos,
    extraReset: [crud.search],
  });

  const vista = useViewMode(`crud-${recurso}`, vistas[0], vistas);

  const columnasConAcciones = [
    ...columnasDatos,
    {
      key: "__acciones",
      header: "Acciones",
      align: "right",
      sortable: false,
      exportable: false,
      render: (fila) => (
        <RowActions
          align="right"
          acciones={accionesEstandar({
            fila,
            onDetalle: crud.verDetalle,
            onEdit: crud.openEdit,
            onToggleEstado: conEstado ? crud.setEstadoTarget : undefined,
            onDelete: crud.setDeleteTarget,
            activo: esActivo(fila),
          })}
        />
      ),
    },
  ];

  const handleGuardar = () => {
    if (!crud.validate()) return;
    crud.guardar();
  };

  /** El detalle se arma con las mismas columnas del listado, mas los campos. */
  const seccionesDetalle = (fila) => {
    if (!fila) return [];
    if (typeof detalleSecciones === "function") return detalleSecciones(fila);

    const desdeColumnas = columnasDatos.map((columna) => ({
      label: columna.header,
      value: columna.render ? columna.render(fila) : fila[columna.key],
    }));

    const clavesUsadas = new Set(columnasDatos.map((columna) => columna.key));
    const desdeCampos = campos
      .filter((campo) => !clavesUsadas.has(campo.name))
      .map((campo) => ({
        label: campo.label,
        value: fila[campo.name],
        ancho: campo.ancho,
      }));

    return [{ titulo: "Informacion del registro", filas: [...desdeColumnas, ...desdeCampos] }];
  };

  const estadoObjetivo = crud.estadoTarget;
  const activandoObjetivo = estadoObjetivo && !esActivo(estadoObjetivo);

  const vacio = {
    icon: emptyIcon,
    title: listaAdmin.hayFiltros || crud.search ? "Sin resultados" : emptyTitle,
    description:
      listaAdmin.hayFiltros || crud.search
        ? "Ningun registro coincide con la busqueda o los filtros aplicados."
        : emptyDescription,
    action:
      listaAdmin.hayFiltros || crud.search ? (
        <Button
          variant="outline"
          onClick={() => {
            listaAdmin.limpiarFiltros();
            crud.setSearch("");
          }}
        >
          Limpiar busqueda y filtros
        </Button>
      ) : (
        <Button onClick={crud.openCreate} className="bg-[#433A9B] text-white hover:bg-[#433A9B]/90">
          <Plus className="mr-2 h-4 w-4" />
          {etiquetaNuevo}
        </Button>
      ),
  };

  const paginacion = (
    <TablePagination
      page={listaAdmin.page}
      totalPages={listaAdmin.totalPages}
      total={listaAdmin.total}
      pageSize={listaAdmin.pageSize}
      loading={crud.loading}
      label="registros"
      onPageChange={listaAdmin.setPage}
      onPageSizeChange={listaAdmin.setPageSize}
    />
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={titulo}
        subtitle={subtitulo ?? `${crud.total} registros en total`}
      >
        {extraAcciones}
        <Button
          onClick={crud.openCreate}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Plus className="h-4 w-4" />
          {etiquetaNuevo}
        </Button>
      </PageHeader>

      {crud.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {crud.error}
        </div>
      )}

      <FilterBar
        search={crud.search}
        onSearch={crud.setSearch}
        searchPlaceholder={busquedaPlaceholder}
        definiciones={listaAdmin.definiciones}
        filtros={listaAdmin.filtros}
        onFiltro={listaAdmin.setFiltro}
        filtrosActivos={listaAdmin.filtrosActivos}
        onLimpiar={listaAdmin.limpiarFiltros}
        acciones={
          <>
            {vistas.length > 1 && (
              <ViewToggle modo={vista.modo} onChange={vista.setModo} opciones={vistas} />
            )}
            <ExportMenu
              columnas={columnasConAcciones}
              filtrados={listaAdmin.filtrados}
              todos={crud.items}
              archivo={String(recurso).replace(/^\//, "")}
            />
          </>
        }
      />

      {vista.modo === MODOS.LISTA ? (
        <DataList
          items={listaAdmin.visibles}
          rowKey={idField}
          loading={crud.loading}
          empty={vacio}
          footer={paginacion}
          primario={lista?.primario || ((fila) => columnasDatos[0]?.render?.(fila) ?? fila[columnasDatos[0]?.key])}
          secundario={
            lista?.secundario ||
            ((fila) =>
              columnasDatos[1] ? columnasDatos[1].render?.(fila) ?? fila[columnasDatos[1].key] : null)
          }
          meta={
            lista?.meta ||
            ((fila) =>
              columnasDatos
                .slice(2)
                .filter((columna) => columna.tipo !== "estado")
                .slice(0, 3)
                .map((columna) => ({
                  label: columna.header,
                  value: columna.render ? columna.render(fila) : fila[columna.key],
                })))
          }
          estado={conEstado ? (fila) => fila.estado : undefined}
          onClick={crud.verDetalle}
          acciones={(fila) => (
            <RowActions
              acciones={accionesEstandar({
                fila,
                onDetalle: crud.verDetalle,
                onEdit: crud.openEdit,
                onToggleEstado: conEstado ? crud.setEstadoTarget : undefined,
                onDelete: crud.setDeleteTarget,
                activo: esActivo(fila),
              })}
            />
          )}
        />
      ) : (
        <DataTable
          columns={columnasConAcciones}
          rows={listaAdmin.visibles}
          loading={crud.loading}
          rowKey={idField}
          empty={vacio}
          orden={listaAdmin.orden}
          onOrdenar={listaAdmin.ordenarPor}
          footer={paginacion}
        />
      )}

      <Modal
        open={crud.modalOpen}
        title={crud.editing ? `Editar ${titulo.toLowerCase()}` : etiquetaNuevo}
        description={
          crud.editing
            ? `Actualiza los datos de ${nombreRegistro(crud.editing)}.`
            : "Los campos marcados con * son obligatorios."
        }
        onClose={crud.closeModal}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={crud.closeModal}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
              disabled={crud.guardando}
              onClick={handleGuardar}
            >
              <Check className="mr-2 h-4 w-4" />
              {crud.guardando ? "Guardando..." : crud.editing ? "Guardar cambios" : "Crear"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.name} className={campo.ancho === "completo" ? "sm:col-span-2" : ""}>
              <FormField
                label={campo.label}
                type={campo.type}
                rows={campo.rows}
                min={campo.min}
                max={campo.max}
                step={campo.step}
                hint={campo.hint}
                required={campo.required || required.includes(campo.name)}
                placeholder={campo.placeholder}
                options={campo.options}
                emptyOption={campo.emptyOption}
                value={crud.form[campo.name] ?? ""}
                error={crud.errors[campo.name]}
                onChange={(valor) => crud.setField(campo.name, valor)}
              />
            </div>
          ))}
        </div>
      </Modal>

      <DetailModal
        open={Boolean(crud.detalle)}
        title={crud.detalle ? nombreRegistro(crud.detalle) : ""}
        subtitle={titulo}
        estado={conEstado ? crud.detalle?.estado : null}
        secciones={seccionesDetalle(crud.detalle)}
        onClose={crud.cerrarDetalle}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={crud.cerrarDetalle}>
              Cerrar
            </Button>
            <Button
              className="flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
              onClick={() => {
                const fila = crud.detalle;
                crud.cerrarDetalle();
                crud.openEdit(fila);
              }}
            >
              Editar
            </Button>
          </>
        }
      />

      <ConfirmDialog
        open={Boolean(estadoObjetivo)}
        tono={activandoObjetivo ? "exito" : "advertencia"}
        title={activandoObjetivo ? "Activar registro?" : "Desactivar registro?"}
        description={
          activandoObjetivo
            ? `${nombreRegistro(estadoObjetivo)} volvera a estar disponible en los listados y formularios.`
            : `${nombreRegistro(estadoObjetivo)} dejara de aparecer en los formularios, pero conserva su historia.`
        }
        confirmLabel={activandoObjetivo ? "Activar" : "Desactivar"}
        loading={crud.procesando}
        onCancel={() => crud.setEstadoTarget(null)}
        onConfirm={() => crud.cambiarEstado(estadoObjetivo)}
      />

      <ConfirmDialog
        open={Boolean(crud.deleteTarget)}
        title={`Eliminar ${titulo.toLowerCase()}?`}
        description={`Se eliminara ${nombreRegistro(crud.deleteTarget)}. Si el registro tiene historia, el sistema lo inactiva en lugar de borrarlo.`}
        loading={crud.procesando}
        onCancel={() => crud.setDeleteTarget(null)}
        onConfirm={() => crud.eliminar(crud.deleteTarget)}
      />
    </div>
  );
}
