import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";

const sinTildes = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * Departamentos y municipios de Colombia para un formulario de direccion.
 *
 * Los departamentos se piden una vez cuando el formulario se abre (`activo`).
 * Los municipios, cada vez que cambia el departamento: se escoge por NOMBRE
 * (es lo que se guarda en el registro) y aqui se busca su id para pedirlos.
 * Es el catalogo del backend (`GET /ubicaciones`), que a su vez consulta
 * api-colombia.com y tiene una copia local por si esa API no responde.
 *
 * Devuelve las opciones listas para `FormField`: `{ value: nombre, label: nombre }`.
 */
export function useUbicaciones({ activo = true, departamento = "" } = {}) {
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState({ idDepartamento: null, lista: [] });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activo || departamentos.length > 0) return undefined;

    const control = new AbortController();
    setCargando(true);
    setError(null);
    apiClient
      .get(endpoints.departamentos, { signal: control.signal })
      .then((respuesta) => setDepartamentos(respuesta?.datos ?? []))
      .catch((problema) => {
        if (problema.name !== "AbortError") setError(problema.message);
      })
      .finally(() => setCargando(false));

    return () => control.abort();
  }, [activo, departamentos.length]);

  const idDepartamento = useMemo(
    () => departamentos.find((fila) => sinTildes(fila.nombre) === sinTildes(departamento))?.id ?? null,
    [departamentos, departamento],
  );

  useEffect(() => {
    if (!idDepartamento) return undefined;

    const control = new AbortController();
    apiClient
      .get(buildPath(endpoints.municipios, { id: idDepartamento }), { signal: control.signal })
      .then((respuesta) => setMunicipios({ idDepartamento, lista: respuesta?.datos ?? [] }))
      .catch((problema) => {
        if (problema.name !== "AbortError") setError(problema.message);
      });

    return () => control.abort();
  }, [idDepartamento]);

  const aOpciones = (lista) => lista.map((fila) => ({ value: fila.nombre, label: fila.nombre }));

  return {
    cargando,
    error,
    departamentos: useMemo(() => aOpciones(departamentos), [departamentos]),
    // Los municipios de un departamento anterior no se muestran mientras llegan los del nuevo.
    municipios: useMemo(
      () => (idDepartamento && municipios.idDepartamento === idDepartamento ? aOpciones(municipios.lista) : []),
      [idDepartamento, municipios],
    ),
  };
}
