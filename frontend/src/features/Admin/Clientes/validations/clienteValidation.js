import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de cliente -> tabla `clientes`.
 *
 * `clientes` absorbio a `marcas`: una fila es un cliente-marca, y lo que
 * la identifica es `nombre` --como la planta lo nombra-- no el documento.
 * Por eso `nombre` es lo unico obligatorio y el NIT quedo opcional:
 * cuando llega un lote a media manana, la digitadora tiene que poder
 * registrar el cliente con el nombre que trae la hoja.
 *
 * Y por eso el documento ya NO es unico: un mismo cliente juridico puede
 * tener varias marcas, y son varias filas con el mismo NIT.
 */
export const clienteLimites = {
  nombre: { min: 2, max: 120 },
  descripcion: { max: 255 },
  razonSocial: { max: 160 },
  documento: { min: 5, max: 30 },
  telefono: { min: 7, max: 15 },
  direccion: { max: 200 },
};

export const clienteTiposDocumento = ["CC", "CE", "NIT", "PASAPORTE", "OTRO"];
export const clienteEstados = ["ACTIVO", "INACTIVO"];

export function crearClienteEsquema({ lista = [], editing = null } = {}) {
  return {
    nombre: [
      reglas.requerido("El nombre del cliente"),
      reglas.longitud({ ...clienteLimites.nombre, etiqueta: "El nombre del cliente" }),
      reglas.unico({
        lista,
        campo: "nombre",
        idField: "id_cliente",
        actual: editing,
        etiqueta: "Ese nombre",
      }),
    ],
    descripcion: [reglas.longitud({ ...clienteLimites.descripcion, etiqueta: "La descripcion" })],
    razon_social: [reglas.longitud({ ...clienteLimites.razonSocial, etiqueta: "La razon social" })],
    tipo_documento: [
      reglas.seleccionRequerida("El tipo de documento"),
      reglas.opcionValida(clienteTiposDocumento, "El tipo de documento"),
    ],
    numero_documento: [
      reglas.longitud({ ...clienteLimites.documento, etiqueta: "El numero de documento" }),
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
