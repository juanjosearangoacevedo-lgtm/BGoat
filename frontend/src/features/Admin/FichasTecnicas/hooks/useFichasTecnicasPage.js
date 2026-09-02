import { useCallback, useMemo, useState } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";
import { aFechaInput } from "@/shared/utils/formatters";
import {
  crearFichaTecnicaEsquema,
  fichaEstados,
} from "../validations/fichaTecnicaValidation";

/**
 * Modulo Fichas Tecnicas -> tabla `fichas_tecnicas`.
 *
 * `sam_pactado` es el tiempo estandar negociado con el cliente: los minutos
 * que se pagan por unidad. Es el dato con el que se calcula la meta horaria.
 */
export const fichaStatusOptions = fichaEstados.map((estado) => ({
  value: estado,
  label: estado.charAt(0) + estado.slice(1).toLowerCase(),
}));

export const emptyFichaTecnicaForm = {
  id_referencia: "",
  codigo_ficha: "",
  version: "1.0",
  descripcion: "",
  material_principal: "",
  ruta_imagen: "",
  ruta_documento_pdf: "",
  sam_pactado: "",
  personal_requerido: "",
  estado: "BORRADOR",
  fecha_vigencia: "",
};

const aNumero = (valor) =>
  valor === "" || valor === null || valor === undefined ? null : Number(valor);

export function useFichasTecnicasPage() {
  const referencias = useCatalogo(endpoints.referencias, {
    valor: "id_referencia",
    etiqueta: (fila) => fila.codigo + " - " + fila.nombre,
  });

  const crud = useCrudResource({
    recurso: endpoints.fichasTecnicas,
    idField: "id_ficha_tecnica",
    emptyForm: emptyFichaTecnicaForm,
    nombreRegistro: (ficha) => (ficha?.codigo_ficha ? `la ficha ${ficha.codigo_ficha}` : "la ficha"),
    esquema: ({ items, editing }) =>
      crearFichaTecnicaEsquema({ lista: items, editing, referenciaOptions: referencias.options }),
    transformarPayload: (datos) => ({
      ...datos,
      id_referencia: Number(datos.id_referencia),
      sam_pactado: aNumero(datos.sam_pactado),
      personal_requerido: aNumero(datos.personal_requerido),
    }),
  });

  const [selected, setSelected] = useState(null);
  const [detalleFicha, setDetalleFicha] = useState({ operaciones: [], materiales: [], medidas: [] });

  /** Abre el detalle y trae las tres tablas hijas de la ficha. */
  const abrirDetalle = useCallback(async (ficha) => {
    setSelected(ficha);
    setDetalleFicha({ operaciones: [], materiales: [], medidas: [] });

    const id = ficha.id_ficha_tecnica;
    try {
      const [operaciones, materiales, medidas] = await Promise.all([
        apiClient.get(buildPath(endpoints.fichaOperaciones, { id })),
        apiClient.get(buildPath(endpoints.fichaMateriales, { id })),
        apiClient.get(buildPath(endpoints.fichaMedidas, { id })),
      ]);
      setDetalleFicha({
        operaciones: operaciones?.datos ?? [],
        materiales: materiales?.datos ?? [],
        medidas: medidas?.datos ?? [],
      });
    } catch {
      // El detalle es complementario: si falla, la ficha se ve igual.
    }
  }, []);

  const cerrarDetalle = () => {
    setSelected(null);
    setDetalleFicha({ operaciones: [], materiales: [], medidas: [] });
  };

  const marcas = useMemo(
    () => Array.from(new Set(crud.items.map((ficha) => ficha.nombre_marca).filter(Boolean))).sort(),
    [crud.items],
  );

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: fichaStatusOptions,
      },
      {
        clave: "nombre_marca",
        label: "Marca",
        etiquetaTodos: "Todas las marcas",
        opciones: marcas.map((marca) => ({ value: marca, label: marca })),
      },
      {
        clave: "sam",
        label: "SAM",
        etiquetaTodos: "Con y sin SAM",
        opciones: [
          { value: "con", label: "Con SAM pactado" },
          { value: "sin", label: "Sin SAM (no calcula meta)" },
        ],
        comparar: (fila, valor) =>
          valor === "con" ? Number(fila.sam_pactado || 0) > 0 : !Number(fila.sam_pactado || 0),
      },
    ],
    [marcas],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "codigo_ficha", direccion: "asc" },
    pageSize: 12,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const contar = (estado) =>
      crud.items.filter((ficha) => String(ficha.estado || "").toUpperCase() === estado).length;

    return {
      total: crud.items.length,
      vigentes: contar("VIGENTE"),
      borradores: contar("BORRADOR"),
      sinSam: crud.items.filter((ficha) => !Number(ficha.sam_pactado || 0)).length,
    };
  }, [crud.items]);

  /** Las fechas de MySQL deben llegar como aaaa-mm-dd al input del formulario. */
  const abrirEditar = (ficha) =>
    crud.openEdit({ ...ficha, fecha_vigencia: aFechaInput(ficha.fecha_vigencia) });

  /** En fichas el par activo/inactivo es VIGENTE / INACTIVA. */
  const alternarVigencia = (ficha) =>
    crud.cambiarEstado(ficha, String(ficha.estado).toUpperCase() === "VIGENTE" ? "INACTIVA" : "VIGENTE");

  return {
    ...crud,
    abrirEditar,
    alternarVigencia,
    lista,
    resumen,
    fichas: crud.items,
    selected,
    abrirDetalle,
    cerrarDetalle,
    detalle: detalleFicha,
    referenciaOptions: referencias.options,
    referenciaDe: (id) => referencias.buscar(id),
  };
}
