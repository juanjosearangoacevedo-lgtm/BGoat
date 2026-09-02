import { estaVacio } from "./formValidation";

/**
 * Reglas de campos de seleccion: select, radio, checkbox y autocomplete.
 *
 * Un select obligatorio no puede quedarse en su opcion vacia
 * ("Seleccionar marca"), y el valor enviado tiene que ser uno de los que el
 * catalogo ofrecio: si el usuario elige una marca y luego esa marca se
 * inactiva, el id ya no vale.
 */
export const seleccionRequerida =
  (etiqueta = "Este campo", { vacios = ["", "todos", "all", "0"] } = {}) =>
  (valor) => {
    if (estaVacio(valor) || vacios.includes(String(valor).toLowerCase())) {
      return `Selecciona ${etiqueta.toLowerCase()}`;
    }
    return "";
  };

/** El valor enviado debe existir en las opciones del catalogo. */
export const opcionValida =
  (opciones = [], etiqueta = "La opcion seleccionada") =>
  (valor) => {
    if (estaVacio(valor)) return "";
    if (opciones.length === 0) return "";

    const valores = opciones.map((opcion) => String(opcion?.value ?? opcion));
    return valores.includes(String(valor)) ? "" : `${etiqueta} ya no esta disponible`;
  };

/** Al menos una casilla marcada (permisos de un rol, prendas de una orden). */
export const seleccionMinima =
  ({ min = 1, etiqueta = "Selecciona al menos una opcion" } = {}) =>
  (valor) => {
    const cantidad = valor instanceof Set ? valor.size : Array.isArray(valor) ? valor.length : 0;
    return cantidad >= min ? "" : etiqueta;
  };

/**
 * Campo obligatorio solo cuando otro campo tiene cierto valor.
 * Ejemplo: la nota es obligatoria cuando la causa elegida la exige.
 */
export const requeridoSi =
  (condicion, mensaje = "Este campo es obligatorio") =>
  (valor, form) => {
    if (!condicion(form)) return "";
    return estaVacio(valor) ? mensaje : "";
  };
