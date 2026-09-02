import { useMemo } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { endpoints } from "@/shared/services/endpoints";
import { aFechaInput } from "@/shared/utils/formatters";
import { crearLoteEsquema, loteEstados } from "../validations/loteValidation";

/**
 * Modulo Lotes -> tabla `lotes`.
 * El lote llega del cliente asociado a una marca y, opcionalmente, a un
 * pedido y a una referencia.
 *
 * El filtrado, el orden y la paginacion ocurren sobre el listado ya cargado
 * (`useListaAdmin`), asi el contador de registros y las paginas siempre
 * hablan de lo mismo.
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
  id_marca: "",
  id_pedido: "",
  id_referencia: "",
  fecha_recepcion: "",
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
  const marcas = useCatalogo(endpoints.marcas, { valor: "id_marca", etiqueta: "nombre" });

  const crud = useCrudResource({
    recurso: endpoints.lotes,
    idField: "id_lote",
    emptyForm: emptyLoteForm,
    nombreRegistro: (lote) => (lote?.codigo_lote ? `el lote ${lote.codigo_lote}` : "el lote"),
    esquema: ({ items, editing }) =>
      crearLoteEsquema({ lista: items, editing, marcaOptions: marcas.options }),
    transformarPayload: (datos) => ({
      ...datos,
      id_marca: aNumero(datos.id_marca),
      id_pedido: aNumero(datos.id_pedido),
      id_referencia: aNumero(datos.id_referencia),
      cantidad_programada: Number(datos.cantidad_programada || 0),
      cantidad_recibida: Number(datos.cantidad_recibida || 0),
    }),
  });

  const pedidos = useCatalogo(endpoints.pedidos, { valor: "id_pedido", etiqueta: "numero_pedido" });
  const referencias = useCatalogo(endpoints.referencias, {
    valor: "id_referencia",
    etiqueta: (fila) => `${fila.codigo} - ${fila.nombre}`,
  });

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: loteStatusOptions,
      },
      { clave: "id_marca", label: "Marca", etiquetaTodos: "Todas las marcas", opciones: marcas.options },
      { clave: "fecha_recepcion", label: "Recepcion", tipo: "fecha" },
    ],
    [marcas.options],
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
      finalizados: contar("FINALIZADO"),
      unidades: crud.items.reduce((suma, lote) => suma + Number(lote.cantidad_programada || 0), 0),
    };
  }, [crud.items]);

  /** Al editar, las fechas de MySQL deben llegar como aaaa-mm-dd al input. */
  const abrirEditar = (lote) =>
    crud.openEdit({
      ...lote,
      fecha_recepcion: aFechaInput(lote.fecha_recepcion),
      fecha_inicio: aFechaInput(lote.fecha_inicio),
      fecha_finalizacion: aFechaInput(lote.fecha_finalizacion),
    });

  return {
    ...crud,
    abrirEditar,
    lista,
    resumen,
    marcaOptions: marcas.options,
    pedidoOptions: pedidos.options,
    referenciaOptions: referencias.options,
    nombreMarca: (id) => marcas.buscar(id)?.nombre || "",
  };
}
