import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Estado CRUD conectado a la API.
 *
 * Trae el listado del backend y concentra lo que todos los modulos repiten:
 * formulario, validaciones, guardado, cambio de estado, detalle y borrado.
 *
 *   recurso  -> ruta de `endpoints` (por ejemplo "/clientes")
 *   idField  -> llave primaria real de la tabla (`id_cliente`, `id_lote`, ...)
 *   filtros  -> objeto de query string que se envia al listar
 *   esquema  -> reglas de validacion (objeto o funcion que recibe el contexto)
 *
 * El filtrado fino, el orden y la paginacion viven en `useListaAdmin`, que
 * trabaja sobre `items`. Aqui solo se pide el listado completo del recurso.
 */
const POR_PAGINA_MAXIMO = 500;

/** Columna que guarda el estado en todas las tablas del schema bgoat. */
const CAMPO_ESTADO = "estado";

export function useCrudResource({
  recurso,
  emptyForm = {},
  required = [],
  etiquetas = {},
  esquema = null,
  idField = "id",
  filtros = {},
  autoCargar = true,
  transformarPayload = null,
  porPagina = POR_PAGINA_MAXIMO,
  nombreRegistro = null,
} = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [estadoTarget, setEstadoTarget] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const filtrosSerializados = JSON.stringify(filtros);
  const requeridosSerializados = required.join("|");

  const cargar = useCallback(async () => {
    if (!recurso) return;

    setLoading(true);
    setError(null);
    try {
      const respuesta = await apiClient.get(
        withQuery(recurso, {
          ...JSON.parse(filtrosSerializados),
          buscar: search,
          porPagina,
        }),
      );
      const datos = respuesta?.datos ?? [];
      setItems(datos);
      setTotal(Number(respuesta?.total ?? datos.length));
    } catch (problema) {
      setError(problema.message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [recurso, search, filtrosSerializados, porPagina]);

  useEffect(() => {
    if (!autoCargar) return undefined;
    const temporizador = setTimeout(cargar, search ? 300 : 0);
    return () => clearTimeout(temporizador);
  }, [cargar, autoCargar, search]);

  const getId = useCallback((item) => item?.[idField], [idField]);

  const nombreDe = useCallback(
    (item) =>
      typeof nombreRegistro === "function" ? nombreRegistro(item) : item?.nombre || "el registro",
    [nombreRegistro],
  );

  const setField = (campo, valor) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    setErrors((previo) => ({ ...previo, [campo]: "" }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...emptyForm, ...item });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setErrors({});
  };

  /**
   * Reglas del modulo (`features/<modulo>/validations/`) mas una red de
   * seguridad: si un campo aparece en `required` pero el esquema no lo cubre,
   * se le agrega la regla de obligatorio. Un campo que el esquema ya valida
   * conserva su mensaje propio, que es mas especifico.
   */
  const construirEsquema = useCallback(() => {
    const propio = typeof esquema === "function" ? esquema({ form, editing, items, idField }) : esquema;
    const combinado = { ...(propio || {}) };

    required.forEach((campo) => {
      if (!combinado[campo]) combinado[campo] = [reglas.requerido(etiquetas[campo] || campo)];
    });

    return combinado;
    // `required` y `etiquetas` son literales estaticos de cada modulo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esquema, form, editing, items, idField, requeridosSerializados]);

  const validate = () => {
    const encontrados = validarFormulario(form, construirEsquema());
    setErrors(encontrados);

    if (Object.keys(encontrados).length > 0) {
      toast.error("Revisa los campos marcados antes de guardar");
      return false;
    }
    return true;
  };

  /** Traduce un error del backend a un mensaje util, y lo ancla al campo si se puede. */
  const reportarError = useCallback((problema, camposUnicos = []) => {
    if (problema.status === 409 && camposUnicos[0]) {
      setErrors((previo) => ({ ...previo, [camposUnicos[0]]: problema.message }));
    }
    toast.error(problema.message);
  }, []);

  /** Crea o actualiza contra la API. Devuelve el registro guardado o null. */
  const guardar = useCallback(
    async (extra = {}) => {
      const payload = transformarPayload
        ? transformarPayload({ ...form, ...extra }, editing)
        : { ...form, ...extra };

      setGuardando(true);
      try {
        const guardado = editing
          ? await apiClient.put(`${recurso}/${editing[idField]}`, payload)
          : await apiClient.post(recurso, payload);

        toast.success(editing ? "Cambios guardados correctamente" : "Registro creado correctamente");
        setModalOpen(false);
        setErrors({});
        await cargar();
        return guardado;
      } catch (problema) {
        reportarError(problema, required);
        return null;
      } finally {
        setGuardando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cargar, editing, form, idField, recurso, transformarPayload, reportarError, requeridosSerializados],
  );

  /**
   * Activa o inactiva un registro sin abrir el formulario.
   * Manda el registro completo porque el PUT generico reemplaza las columnas
   * declaradas del recurso, no solo las que cambian.
   */
  const cambiarEstado = useCallback(
    async (item, nuevoEstado) => {
      const id = item?.[idField];
      if (!id) return false;

      const activo = String(item[CAMPO_ESTADO] || "").toUpperCase().startsWith("ACTIV");
      const destino = nuevoEstado || (activo ? "INACTIVO" : "ACTIVO");

      setProcesando(true);
      try {
        await apiClient.put(`${recurso}/${id}`, { ...item, [CAMPO_ESTADO]: destino });

        // La fila se refresca al instante y luego se confirma con el backend.
        setItems((previo) =>
          previo.map((fila) => (fila[idField] === id ? { ...fila, [CAMPO_ESTADO]: destino } : fila)),
        );
        toast.success(
          destino.startsWith("ACTIV") ? `Se activo ${nombreDe(item)}` : `Se desactivo ${nombreDe(item)}`,
        );
        await cargar();
        return true;
      } catch (problema) {
        toast.error(problema.message);
        return false;
      } finally {
        setProcesando(false);
        setEstadoTarget(null);
      }
    },
    [cargar, idField, recurso, nombreDe],
  );

  /** Elimina (o inactiva, segun la regla del backend). */
  const eliminar = useCallback(
    async (item) => {
      const id = item?.[idField];
      if (!id) return false;

      setProcesando(true);
      try {
        await apiClient.delete(`${recurso}/${id}`);
        toast.success("Registro eliminado correctamente");
        await cargar();
        return true;
      } catch (problema) {
        toast.error(problema.message);
        return false;
      } finally {
        setProcesando(false);
        setDeleteTarget(null);
      }
    },
    [cargar, idField, recurso],
  );

  // La busqueda ya la filtra el backend; este memo solo evita re-render extra.
  const visibles = useMemo(() => items, [items]);

  return {
    items: visibles,
    allItems: items,
    setItems,
    total,
    /** El backend corta en 500 filas: avisa si el listado quedo incompleto. */
    truncado: total > items.length,
    loading,
    error,
    guardando,
    procesando,
    search,
    setSearch,
    form,
    setForm,
    setField,
    errors,
    setErrors,
    editing,
    modalOpen,
    openCreate,
    openEdit,
    closeModal,
    validate,
    deleteTarget,
    setDeleteTarget,
    estadoTarget,
    setEstadoTarget,
    cambiarEstado,
    detalle,
    verDetalle: setDetalle,
    cerrarDetalle: () => setDetalle(null),
    idField,
    getId,
    guardar,
    eliminar,
    recargar: cargar,
  };
}
