import { estaVacio, reglas } from "@/shared/validations";

/**
 * Reglas del formulario de cliente -> tabla `clientes`.
 *
 * El nombre y la razon social son UN solo campo ("Nombre o razon social"):
 * `nombre`. Lo unico obligatorio es eso: cuando llega un lote a media
 * manana, se registra el cliente con lo que trae la hoja y el resto se
 * completa despues.
 */
export const clienteLimites = {
  nombre: { min: 2, max: 120 },
  descripcion: { max: 255 },
  telefono: { min: 7, max: 15 },
  direccion: { max: 200 },
};

export const clienteTiposDocumento = ["CC", "CE", "NIT", "PASAPORTE", "OTRO"];
export const clienteEstados = ["ACTIVO", "INACTIVO"];

/** Departamento y municipio van juntos: uno solo no dice dónde queda. */
const juntoCon = (otro, mensaje) => (valor, form) =>
  !estaVacio(form?.[otro]) && estaVacio(valor) ? mensaje : "";

export function crearClienteEsquema({ lista = [], editing = null } = {}) {
  return {
    nombre: [
      reglas.requerido("El nombre o la razón social"),
      reglas.longitud({ ...clienteLimites.nombre, etiqueta: "El nombre o la razón social" }),
      reglas.sinCaracteresEspeciales("El nombre o la razón social"),
      reglas.unico({
        lista,
        campo: "nombre",
        idField: "id_cliente",
        actual: editing,
        etiqueta: "Ese nombre",
      }),
    ],
    tipo_documento: [
      reglas.seleccionRequerida("El tipo de documento"),
      reglas.opcionValida(clienteTiposDocumento, "El tipo de documento"),
    ],
    // Segun el tipo: NIT con su digito de verificacion, cédula solo números... (ver documentRules.js)
    numero_documento: [reglas.documento({ actual: editing })],
    correo: [reglas.correo()],
    telefono: [reglas.telefono({ ...clienteLimites.telefono })],
    departamento: [juntoCon("municipio", "Elige también el departamento")],
    municipio: [juntoCon("departamento", "Elige el municipio")],
    direccion: [reglas.longitud({ ...clienteLimites.direccion, etiqueta: "La dirección" })],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(clienteEstados, "El estado"),
    ],
    descripcion: [reglas.longitud({ ...clienteLimites.descripcion, etiqueta: "La descripción" })],
  };
}
