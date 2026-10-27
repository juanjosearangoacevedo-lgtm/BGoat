import { readFileSync } from "node:fs";

/**
 * Departamentos y municipios de Colombia.
 *
 * La fuente es la API publica api-colombia.com (gratis, sin llave). Se
 * consulta desde el backend y no desde la pantalla para guardar la respuesta
 * en memoria un dia entero (la lista casi no cambia) y para no depender de
 * que la API este arriba justo cuando alguien registra un cliente: si no
 * responde, se usa `data/colombia.json`, una copia de la misma lista que se
 * regenera con `npm run ubicaciones:generar`.
 *
 * Los ids son los de api-colombia.com, tambien en la copia, asi que la
 * pantalla trata igual las dos fuentes.
 */
const API = "https://api-colombia.com/api/v1";
const ESPERA_MAXIMA_MS = 4000;
const VIGENCIA_MS = 24 * 60 * 60 * 1000;
/** Despues de un fallo no se vuelve a probar la API por un rato: ahorra la espera a cada peticion. */
const REINTENTO_MS = 5 * 60 * 1000;

const copia = JSON.parse(readFileSync(new URL("../data/colombia.json", import.meta.url), "utf8"));
const copiaPorId = new Map(copia.departamentos.map((departamento) => [departamento.id, departamento]));

const aApi = { departamentos: null, municipios: new Map(), fallaHasta: 0 };

const sinTildes = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

async function pedir(ruta) {
  const respuesta = await fetch(`${API}${ruta}`, { signal: AbortSignal.timeout(ESPERA_MAXIMA_MS) });
  if (!respuesta.ok) throw new Error(`api-colombia.com respondió ${respuesta.status}`);
  return respuesta.json();
}

const vigente = (entrada) => entrada && entrada.hasta > Date.now();

/** Intenta la API; si no puede, devuelve null y la deja descansar unos minutos. */
async function conApi(clave, ruta, convertir) {
  const guardado = clave === "departamentos" ? aApi.departamentos : aApi.municipios.get(clave);
  if (vigente(guardado)) return guardado.datos;
  if (aApi.fallaHasta > Date.now()) return null;

  try {
    const datos = convertir(await pedir(ruta));
    const entrada = { datos, hasta: Date.now() + VIGENCIA_MS };
    if (clave === "departamentos") aApi.departamentos = entrada;
    else aApi.municipios.set(clave, entrada);
    return datos;
  } catch (error) {
    aApi.fallaHasta = Date.now() + REINTENTO_MS;
    console.warn(`[BGoat] La API de ubicaciones no respondió (${error.message}); se usa la copia local.`);
    return null;
  }
}

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");

/** `{ fuente: "api" | "copia", datos: [{ id, nombre }] }`. */
export async function listarDepartamentos() {
  const datos = await conApi("departamentos", "/Department", (lista) =>
    lista.map((departamento) => ({ id: departamento.id, nombre: String(departamento.name).trim() })).sort(porNombre),
  );
  if (datos) return { fuente: "api", datos };

  return {
    fuente: "copia",
    datos: copia.departamentos.map(({ id, nombre }) => ({ id, nombre })),
  };
}

/** Los municipios de un departamento, o null si ese id no existe. */
export async function listarMunicipios(idDepartamento) {
  const id = Number(idDepartamento);
  if (!copiaPorId.has(id)) return null;

  const datos = await conApi(`municipios:${id}`, `/Department/${id}/cities`, (lista) =>
    lista.map((ciudad) => ({ id: ciudad.id, nombre: String(ciudad.name).trim() })).sort(porNombre),
  );
  if (datos && datos.length > 0) return { fuente: "api", datos };

  return { fuente: "copia", datos: copiaPorId.get(id).municipios };
}

/**
 * Comprueba que el municipio pertenezca al departamento (contra la copia, que
 * es estable) y devuelve los dos nombres con su escritura oficial, o null si
 * no existe esa pareja. No distingue mayusculas ni tildes.
 */
export function buscarUbicacion(departamento, municipio) {
  const dep = copia.departamentos.find((fila) => sinTildes(fila.nombre) === sinTildes(departamento));
  if (!dep) return null;
  const mun = dep.municipios.find((fila) => sinTildes(fila.nombre) === sinTildes(municipio));
  return mun ? { departamento: dep.nombre, municipio: mun.nombre } : null;
}
