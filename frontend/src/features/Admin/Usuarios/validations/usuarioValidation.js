import { reglas } from "@/shared/validations";

/**
 * Reglas del formulario de usuario -> tabla `usuarios`.
 *
 * La contrasena viaja en claro y el backend guarda el hash en `clave_hash`;
 * el minimo de 8 caracteres es el mismo que exige `usuarios.routes.js`.
 */
export const usuarioLimites = {
  nombres: { min: 2, max: 60 },
  apellidos: { min: 2, max: 60 },
  documento: { min: 5, max: 20 },
  telefono: { min: 7, max: 15 },
};

export const usuarioTiposDocumento = ["CC", "CE", "TI", "NIT", "PASAPORTE", "OTRO"];
export const usuarioEstados = ["ACTIVO", "INACTIVO", "BLOQUEADO"];

/** El pasaporte admite letras; los demas documentos del pais no. */
const documentoSegunTipo = (valor, form) =>
  form?.tipo_documento === "PASAPORTE"
    ? reglas.longitud({ ...usuarioLimites.documento, etiqueta: "El documento" })(valor, form)
    : reglas.soloDigitos("El numero de documento")(valor, form);

/**
 * `lista` y `editing` vienen del listado en pantalla: sirven para detectar
 * correo o documento repetidos antes de que los rechace la base.
 * `editing` tambien vuelve opcional la contrasena (vacia = no cambiarla).
 */
export function crearUsuarioEsquema({ lista = [], editing = null, roleOptions = [] } = {}) {
  return {
    nombres: [
      reglas.requerido("Los nombres"),
      reglas.longitud({ ...usuarioLimites.nombres, etiqueta: "Los nombres" }),
      reglas.soloLetras("Los nombres"),
    ],
    apellidos: [
      reglas.requerido("Los apellidos"),
      reglas.longitud({ ...usuarioLimites.apellidos, etiqueta: "Los apellidos" }),
      reglas.soloLetras("Los apellidos"),
    ],
    tipo_documento: [
      reglas.seleccionRequerida("El tipo de documento"),
      reglas.opcionValida(usuarioTiposDocumento, "El tipo de documento"),
    ],
    numero_documento: [
      reglas.requerido("El numero de documento"),
      documentoSegunTipo,
      reglas.longitud({ ...usuarioLimites.documento, etiqueta: "El numero de documento" }),
      reglas.unico({
        lista,
        campo: "numero_documento",
        idField: "id_usuario",
        actual: editing,
        etiqueta: "Ese documento",
      }),
    ],
    correo: [
      reglas.requerido("El correo"),
      reglas.correo(),
      reglas.unico({
        lista,
        campo: "correo",
        idField: "id_usuario",
        actual: editing,
        etiqueta: "Ese correo",
      }),
    ],
    telefono: [reglas.telefono({ ...usuarioLimites.telefono })],
    id_rol: [
      reglas.seleccionRequerida("El rol"),
      reglas.opcionValida(roleOptions, "El rol seleccionado"),
    ],
    clave: [reglas.clave({ opcional: Boolean(editing) })],
    confirmar_clave: [reglas.confirmacion("clave", { opcional: Boolean(editing) })],
    estado: [
      reglas.seleccionRequerida("El estado"),
      reglas.opcionValida(usuarioEstados, "El estado"),
    ],
  };
}
