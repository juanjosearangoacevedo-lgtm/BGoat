import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";
import { aFechaInput } from "@/shared/utils/formatters";
import { crearLoteEsquema, loteEstados } from "../validations/loteValidation";

/**
 * Modulo Lotes -> tabla `lotes`.
 *
 * El lote es el trabajo que llega del cliente, y la unica entidad del
 * producto: absorbio al pedido (folio y fechas), a la referencia, a la
 * ficha tecnica (SAM, material, imagen y PDF), al tipo de prenda y al
 * desglose por talla y color.
 *
 * Los modulos de Pedidos, Referencias, Fichas Tecnicas y Prendas
 * desaparecieron porque registrar un trabajo que llega en una sola hoja
 * obligaba a recorrer cinco formularios, y tres de esos registros se
 * usaban una sola vez.
 *
 * El filtrado, el orden y la paginacion ocurren sobre el listado ya
 * cargado (`useListaAdmin`), asi el contador de registros y las paginas
 * siempre hablan de lo mismo.
 */
export const loteStatusOptions = loteEstados.map((estado) => ({
  value: estado,
  label: estado
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (letra) => letra.toUpperCase()),
}));

export const emptyLoteForm = {
  codigo_lote: "",
  numero_pedido: "",
  id_cliente: "",
  codigo_referencia: "",
  nombre_referencia: "",
  id_tipo_prenda: "",
  sam_pactado: "",
  material_principal: "",
  fecha_pedido: "",
  fecha_recepcion: "",
  fecha_entrega_programada: "",
  fecha_entrega_real: "",
  fecha_inicio: "",
  fecha_finalizacion: "",
  cantidad_programada: "",
  cantidad_recibida: "",
  observaciones: "",
  estado: "REGISTRADO",
};

const aNumero = (valor) =>
  valor === "" || valor === null || valor === undefined ? null : Number(valor);

export function useLotesPage() {
  const clientes = useCatalogo(endpoints.clientes, {
    valor: "id_cliente",
    etiqueta: "nombre",
    filtros: { estado: "ACTIVO" },
  });

  // Los catalogos del producto. Ya no tienen pantalla propia: se cargan
  // aqui porque es el unico sitio donde se usan.
  const tiposPrenda = useCatalogo(endpoints.tiposPrenda, {
    valor: "id_tipo_prenda",
    etiqueta: "nombre",
    filtros: { estado: "ACTIVO" },
  });
  const tallas = useCatalogo(endpoints.tallas, {
    valor: "id_talla",
    etiqueta: "nombre",
    filtros: { estado: "ACTIVO" },
  });
  const colores = useCatalogo(endpoints.colores, {
    valor: "id_color",
    etiqueta: "nombre",
    filtros: { estado: "ACTIVO" },
  });

  const [subiendoFicha, setSubiendoFicha] = useState(false);
  const [desglose, setDesglose] = useState([]);
  const [guardandoDesglose, setGuardandoDesglose] = useState(false);

  const crud = useCrudResource({
    recurso: endpoints.lotes,
    idField: "id_lote",
    emptyForm: emptyLoteForm,
    nombreRegistro: (lote) => (lote?.codigo_lote ? `el lote ${lote.codigo_lote}` : "el lote"),
    esquema: ({ items, editing }) =>
      crearLoteEsquema({ lista: items, editing, clienteOptions: clientes.options }),
    transformarPayload: (datos) => ({
      ...datos,
      id_cliente: aNumero(datos.id_cliente),
      id_tipo_prenda: aNumero(datos.id_tipo_prenda),
      sam_pactado: aNumero(datos.sam_pactado),
      cantidad_programada: Number(datos.cantidad_programada || 0),
      cantidad_recibida: Number(datos.cantidad_recibida || 0),
    }),
  });

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: loteStatusOptions,
      },
      {
        clave: "id_cliente",
        label: "Cliente",
        etiquetaTodos: "Todos los clientes",
        opciones: clientes.options,
      },
      {
        clave: "id_tipo_prenda",
        label: "Tipo de prenda",
        etiquetaTodos: "Todos los tipos",
        opciones: tiposPrenda.options,
      },
      {
        clave: "sinSam",
        label: "SAM",
        etiquetaTodos: "Con y sin SAM",
        opciones: [
          { value: "falta", label: "Sin SAM pactado" },
          { value: "tiene", label: "Con SAM pactado" },
        ],
        // Un lote sin SAM no deja iniciar la jornada: este filtro es para
        // encontrarlos antes de que la digitadora se topara con el aviso.
        comparar: (fila, valor) =>
          valor === "falta" ? !Number(fila.sam_pactado) : Boolean(Number(fila.sam_pactado)),
      },
      { clave: "fecha_recepcion", label: "Recepcion", tipo: "fecha" },
    ],
    [clientes.options, tiposPrenda.options],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "fecha_recepcion", direccion: "desc" },
    pageSize: 10,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const contar = (estado) =>
      crud.items.filter((lote) => String(lote.estado || "").toUpperCase() === estado).length;

    return {
      total: crud.items.length,
      enProceso: contar("EN_PROCESO"),
      entregados: contar("ENTREGADO") + contar("FINALIZADO"),
      sinSam: crud.items.filter((lote) => !Number(lote.sam_pactado)).length,
      unidades: crud.items.reduce((suma, lote) => suma + Number(lote.cantidad_programada || 0), 0),
    };
  }, [crud.items]);

  /** Trae el desglose de un lote. Se llama al abrir el detalle o la edicion. */
  const cargarDesglose = useCallback(async (idLote) => {
    if (!idLote) {
      setDesglose([]);
      return [];
    }

    try {
      const respuesta = await apiClient.get(buildPath(endpoints.detalleLote, { id: idLote }));
      const filas = respuesta?.datos ?? [];
      setDesglose(filas);
      return filas;
    } catch {
      setDesglose([]);
      return [];
    }
  }, []);

  /** Al editar, las fechas de MySQL deben llegar como aaaa-mm-dd al input. */
  const abrirEditar = useCallback(
    (lote) => {
      crud.openEdit({
        ...lote,
        fecha_pedido: aFechaInput(lote.fecha_pedido),
        fecha_recepcion: aFechaInput(lote.fecha_recepcion),
        fecha_entrega_programada: aFechaInput(lote.fecha_entrega_programada),
        fecha_entrega_real: aFechaInput(lote.fecha_entrega_real),
        fecha_inicio: aFechaInput(lote.fecha_inicio),
        fecha_finalizacion: aFechaInput(lote.fecha_finalizacion),
      });
      cargarDesglose(lote.id_lote);
    },
    [crud, cargarDesglose],
  );

  const abrirCrear = useCallback(() => {
    setDesglose([]);
    crud.openCreate();
  }, [crud]);

  const verDetalle = useCallback(
    (lote) => {
      crud.verDetalle(lote);
      cargarDesglose(lote?.id_lote);
    },
    [crud, cargarDesglose],
  );

  /**
   * Sube la imagen o el PDF de la ficha tecnica.
   *
   * Va por su propia ruta y no por el PUT del recurso: es un archivo
   * multipart, y la columna destino (`ruta_imagen` o `ruta_documento_pdf`)
   * la decide el backend segun el tipo del archivo, no el formulario.
   */
  const subirFicha = useCallback(
    async (idLote, archivo) => {
      if (!archivo) return null;

      setSubiendoFicha(true);
      try {
        const guardada = await apiClient.subir(
          buildPath(endpoints.fichaLote, { id: idLote }),
          archivo,
        );
        toast.success(guardada.tipo === "pdf" ? "PDF cargado" : "Imagen cargada");
        await crud.recargar();
        return guardada;
      } catch (problema) {
        toast.error(problema.message);
        return null;
      } finally {
        setSubiendoFicha(false);
      }
    },
    [crud],
  );

  const quitarFicha = useCallback(
    async (idLote, tipo) => {
      setSubiendoFicha(true);
      try {
        await apiClient.delete(buildPath(endpoints.fichaLoteTipo, { id: idLote, tipo }));
        toast.success(tipo === "pdf" ? "PDF eliminado" : "Imagen eliminada");
        await crud.recargar();
        return true;
      } catch (problema) {
        toast.error(problema.message);
        return false;
      } finally {
        setSubiendoFicha(false);
      }
    },
    [crud],
  );

  /** Reemplaza el desglose completo del lote. Una lista vacia lo borra. */
  const guardarDesglose = useCallback(
    async (idLote, filas) => {
      setGuardandoDesglose(true);
      try {
        const respuesta = await apiClient.put(
          buildPath(endpoints.detalleLote, { id: idLote }),
          { detalle: filas },
        );
        setDesglose(respuesta?.datos ?? []);
        toast.success(
          respuesta?.total > 0
            ? `Desglose guardado (${respuesta.total} filas, ${respuesta.suma_detalle} unidades)`
            : "Desglose borrado",
        );
        return true;
      } catch (problema) {
        toast.error(problema.message);
        return false;
      } finally {
        setGuardandoDesglose(false);
      }
    },
    [],
  );

  return {
    ...crud,
    abrirEditar,
    openCreate: abrirCrear,
    verDetalle,
    lista,
    resumen,
    clienteOptions: clientes.options,
    tipoPrendaOptions: tiposPrenda.options,
    tallaOptions: tallas.options,
    colorOptions: colores.options,
    nombreCliente: (id) => clientes.buscar(id)?.nombre || "",
    subirFicha,
    quitarFicha,
    subiendoFicha,
    desglose,
    guardarDesglose,
    guardandoDesglose,
  };
}
