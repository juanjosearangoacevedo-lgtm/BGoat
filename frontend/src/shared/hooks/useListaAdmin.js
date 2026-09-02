import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Filtrado + ordenamiento + paginacion de un listado ya cargado.
 *
 * Es la pieza que comparten todos los modulos administrativos para que los
 * tres comportamientos queden sincronizados: al cambiar un filtro o el orden
 * la paginacion vuelve a la primera pagina, y el contador siempre habla de
 * los registros que realmente se estan viendo.
 *
 *   const lista = useListaAdmin(crud.items, {
 *     filtros: [{ clave: "estado", label: "Estado", opciones: [...] }],
 *     ordenInicial: { campo: "nombre", direccion: "asc" },
 *   });
 *
 *   lista.visibles   -> la pagina actual
 *   lista.filtrados  -> todo lo que paso filtros y orden (para exportar)
 */
export const TODOS = "todos";
export const TAMANOS_PAGINA = [10, 25, 50, 100];

/** Un filtro sin elegir no descarta nada. */
function estaInactivo(valor) {
  return valor === undefined || valor === null || valor === "" || valor === TODOS;
}

function esNumero(valor) {
  return valor !== "" && valor !== null && valor !== undefined && !Number.isNaN(Number(valor));
}

const CLAVE_FECHA = /(fecha|_at|creacion|vigencia|ingreso|acceso)/i;

/** Comparador tolerante: numeros como numeros, fechas como fechas, resto texto. */
function comparar(a, b, campo) {
  if (a === b) return 0;
  if (a === null || a === undefined || a === "") return 1;
  if (b === null || b === undefined || b === "") return -1;

  if (esNumero(a) && esNumero(b)) return Number(a) - Number(b);

  if (CLAVE_FECHA.test(campo)) {
    const fechaA = new Date(String(a).replace(" ", "T")).getTime();
    const fechaB = new Date(String(b).replace(" ", "T")).getTime();
    if (!Number.isNaN(fechaA) && !Number.isNaN(fechaB)) return fechaA - fechaB;
  }

  return String(a).localeCompare(String(b), "es", { sensitivity: "base", numeric: true });
}

/** Valor por el que se ordena una columna (permite `sortValue` a medida). */
function valorOrden(fila, definicion) {
  if (typeof definicion?.sortValue === "function") return definicion.sortValue(fila);
  return fila?.[definicion?.campo];
}

export function useListaAdmin(
  filas = [],
  { filtros: definiciones = [], ordenInicial = null, pageSize = 10, columnas = [], extraReset = [] } = {},
) {
  const valoresIniciales = useMemo(() => {
    const base = {};
    definiciones.forEach((definicion) => {
      base[definicion.clave] = definicion.valorInicial ?? TODOS;
    });
    return base;
    // Las definiciones son estaticas por modulo; solo importan las claves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definiciones.map((definicion) => definicion.clave).join("|")]);

  const [filtros, setFiltros] = useState(valoresIniciales);
  const [orden, setOrden] = useState(ordenInicial);
  const [page, setPage] = useState(1);
  const [tamano, setTamano] = useState(pageSize);

  const firmaFiltros = JSON.stringify(filtros);
  const firmaExtra = JSON.stringify(extraReset);

  // Cualquier cambio de criterio devuelve la vista a la primera pagina.
  useEffect(() => {
    setPage(1);
  }, [firmaFiltros, firmaExtra, tamano]);

  const setFiltro = useCallback((clave, valor) => {
    setFiltros((previo) => ({ ...previo, [clave]: valor }));
  }, []);

  const limpiarFiltros = useCallback(() => setFiltros(valoresIniciales), [valoresIniciales]);

  /** Chips de lo que esta filtrando ahora mismo. */
  const filtrosActivos = useMemo(
    () =>
      definiciones
        .filter((definicion) => !estaInactivo(filtros[definicion.clave]))
        .map((definicion) => {
          const valor = filtros[definicion.clave];
          const opcion = definicion.opciones?.find(
            (entrada) => String(entrada.value ?? entrada) === String(valor),
          );

          return {
            clave: definicion.clave,
            label: definicion.label,
            valor,
            texto: opcion?.label ?? String(valor),
          };
        }),
    [definiciones, filtros],
  );

  const filtrados = useMemo(() => {
    const activos = definiciones.filter((definicion) => !estaInactivo(filtros[definicion.clave]));

    const resultado = filas.filter((fila) =>
      activos.every((definicion) => {
        const valor = filtros[definicion.clave];
        if (typeof definicion.comparar === "function") return definicion.comparar(fila, valor);

        const campo = definicion.campo || definicion.clave;
        const contenido = fila?.[campo];

        if (definicion.tipo === "texto") {
          return String(contenido ?? "")
            .toLowerCase()
            .includes(String(valor).toLowerCase());
        }

        if (definicion.tipo === "fecha") {
          return String(contenido ?? "").slice(0, 10) === String(valor).slice(0, 10);
        }

        return String(contenido ?? "") === String(valor);
      }),
    );

    if (!orden?.campo) return resultado;

    const definicion = {
      campo: orden.campo,
      sortValue: columnas.find((columna) => (columna.sortKey || columna.key) === orden.campo)?.sortValue,
    };
    const signo = orden.direccion === "desc" ? -1 : 1;

    // `slice` para no reordenar el arreglo que viene del hook de datos.
    return resultado
      .slice()
      .sort((a, b) => signo * comparar(valorOrden(a, definicion), valorOrden(b, definicion), orden.campo));
  }, [filas, definiciones, filtros, orden, columnas]);

  const total = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(total / tamano));
  const paginaSegura = Math.min(page, totalPages);

  // Si el filtro reduce el listado, la pagina actual puede quedar fuera de rango.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibles = useMemo(
    () => filtrados.slice((paginaSegura - 1) * tamano, paginaSegura * tamano),
    [filtrados, paginaSegura, tamano],
  );

  /** Alterna asc -> desc -> sin orden sobre una misma columna. */
  const ordenarPor = useCallback((campo) => {
    setOrden((previo) => {
      if (previo?.campo !== campo) return { campo, direccion: "asc" };
      if (previo.direccion === "asc") return { campo, direccion: "desc" };
      return null;
    });
  }, []);

  return {
    definiciones,
    filtros,
    setFiltro,
    limpiarFiltros,
    filtrosActivos,
    hayFiltros: filtrosActivos.length > 0,
    orden,
    ordenarPor,
    setOrden,
    page: paginaSegura,
    setPage,
    pageSize: tamano,
    setPageSize: setTamano,
    totalPages,
    total,
    visibles,
    filtrados,
  };
}
