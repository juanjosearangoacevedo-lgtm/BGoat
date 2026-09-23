/**
 * El WHERE de un listado: un termino de busqueda sobre varias columnas,
 * mas filtros de igualdad.
 *
 * Estaba escrito tres veces --en `lib/crud.js`, en el listado de ordenes
 * y en el de usuarios-- y las tres versiones no se ponian de acuerdo en
 * que valor significa "sin filtrar": `crud` ignoraba `"todos"`, ordenes
 * ignoraba `"todos"` y `"all"`, y usuarios miraba `"todos"` para un campo
 * y `"all"` para otro. El centinela que manda el frontend es `"todos"`
 * (`useListaAdmin.TODOS`); aqui se aceptan los dos y de paso el vacio.
 *
 * Las columnas las pone SIEMPRE el servidor, nunca el cliente: llegan de
 * la definicion del recurso o escritas en la ruta. Lo unico que viene de
 * afuera son los VALORES, y esos salen como parametros de la consulta.
 */
const SIN_FILTRAR = new Set(["", "todos", "all"]);

export function filtrosDeListado(consulta = {}, { buscarEn = [], iguales = [] } = {}) {
  const condiciones = [];
  const valores = [];

  const termino = String(consulta.buscar || "").trim();
  if (termino && buscarEn.length > 0) {
    condiciones.push("(" + buscarEn.map((columna) => `${columna} LIKE ?`).join(" OR ") + ")");
    buscarEn.forEach(() => valores.push(`%${termino}%`));
  }

  for (const entrada of iguales) {
    const { parametro, columna } =
      typeof entrada === "string" ? { parametro: entrada, columna: entrada } : entrada;

    const valor = consulta[parametro];
    if (valor === undefined || valor === null || SIN_FILTRAR.has(String(valor))) continue;

    condiciones.push(`${columna} = ?`);
    valores.push(valor);
  }

  return {
    where: condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "",
    valores,
  };
}
