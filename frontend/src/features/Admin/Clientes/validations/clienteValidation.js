import { estaVacio, reglas } from "@/shared/validations";

/**
 * Reglas del formulario de cliente -> tabla `clientes`.
 * razon_social VARCHAR(120), nombres/apellidos VARCHAR(60), direccion VARCHAR(150).
 */
export const clienteLimites = {
  razonSocial: { max: 120 },
  nombres: { max: 60 },
  apellidos: { max: 60 },
  documento: { min: 5, max: 20 },
  telefono: { min: 7, max: 15 },
  direccion: { max: 150 },
};

export const clienteTiposDocumento = ["CC", "CE", "NIT", "PASAPORTE", "OTRO"];
export const clienteEstados = ["ACTIVO", "INACTIVO"];

/**
 * Un cliente es empresa (razon social) o persona (nombres y apellidos):
 * sin uno de los dos el listado quedaria con una fila sin nombre.
 */
const identificacionMinima = (valor, form) =>
  estaVacio(form.razon_social) && estaVacio(form.nombres)
    ? "Indica la razon social (empresa) o los nombres (persona)"
    : "";

export function crearClienteEsquema({ lista = [], editing = null } = {}) {
  return {
    tipo_documento: [
      reglas.seleccionRequerida("El tipo de documento"),
      reglas.opcionValida(clienteTiposDocumento, "El tipo de documento"),
    ],
    numero_documento: [
      reglas.requerido("El numero de documento"),
      reglas.longitud({ ...clienteLimites.documento, etiqueta: "El numero de documento" }),
      reglas.unico({
        lista,
        campo: "numero_documento",
        idField: "id_cliente",
        actual: editing,
        etiqueta: "Ese documento",
      }),
    ],
    razon_social: [
      identificacionMinima,
      reglas.longitud({ ...clienteLimites.razonSocial, etiqueta: "La razon social" }),
    ],
    nombres: [
      reglas.longitud({ ...clienteLimites.nombres, etiqueta: "Los nombres" }),
      reglas.soloLetras("Los nombres"),
    ],
    apellidos: [
      reglas.longitud({ ...clienteLimites.apellidos, etiqueta: "Los apellidos" }),
      reglas.soloLetras("Los apellidos"),
    ],
    correo: [reglas.correo()],
    telefono: [reglas.telefono({ ...clienteLimites.telefono })],
    direccion: [reglas.longitud({ ...clienteLimites.direccion, etiqueta: "La direccion" })],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(clienteEstados, "El estado"),
    ],
  };
}
