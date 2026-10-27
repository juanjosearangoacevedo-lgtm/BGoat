/**
 * Baja de api-colombia.com la lista de departamentos y municipios y la deja
 * en `src/data/colombia.json`, que es el respaldo de `src/lib/ubicaciones.js`
 * cuando la API no responde.
 *
 *   npm run ubicaciones:generar
 *
 * La lista casi no cambia (hay un municipio nuevo cada varios años), asi que
 * esto se corre rara vez, y el resultado se sube al repositorio.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api-colombia.com/api/v1";
const destino = resolve(dirname(fileURLToPath(import.meta.url)), "../src/data/colombia.json");

async function pedir(ruta) {
  const respuesta = await fetch(`${API}${ruta}`, { signal: AbortSignal.timeout(30000) });
  if (!respuesta.ok) throw new Error(`${ruta} respondió ${respuesta.status}`);
  return respuesta.json();
}

try {
  const [departamentos, ciudades] = await Promise.all([pedir("/Department"), pedir("/City")]);

  const porDepartamento = new Map(
    departamentos.map((departamento) => [departamento.id, { id: departamento.id, nombre: departamento.name.trim(), municipios: [] }]),
  );
  for (const ciudad of ciudades) {
    porDepartamento.get(ciudad.departmentId)?.municipios.push({ id: ciudad.id, nombre: ciudad.name.trim() });
  }

  const ordenar = (a, b) => a.nombre.localeCompare(b.nombre, "es");
  const lista = [...porDepartamento.values()].sort(ordenar);
  lista.forEach((departamento) => departamento.municipios.sort(ordenar));

  const total = lista.reduce((suma, departamento) => suma + departamento.municipios.length, 0);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(
    destino,
    `${JSON.stringify({ fuente: "https://api-colombia.com", generado: new Date().toISOString().slice(0, 10), departamentos: lista })}\n`,
  );
  console.log(`Listo: ${lista.length} departamentos y ${total} municipios en ${destino}`);
} catch (error) {
  console.error(`No se pudo generar la lista: ${error.message}`);
  process.exitCode = 1;
}
