import { reglas } from "@/shared/validations";

/**
 * Reglas de los formularios de acceso -> tabla `usuarios`.
 *
 * Son tres formularios que comparten campos, por eso viven en el mismo
 * archivo de la feature: login, registro y recuperacion de contrasena.
 *
 * El registro no pide `id_rol`: lo asigna un administrador desde el modulo
 * Usuarios (regla de seguridad del alcance).
 */
export const authLimites = {
  nombres: { min: 2, max: 60 },
  apellidos: { min: 2, max: 60 },
  documento: { min: 5, max: 20 },
  telefono: { min: 7, max: 15 },
};

export const authTiposDocumento = ["CC", "CE", "TI", "PASAPORTE", "OTRO"];

/** El pasaporte admite letras; los demas documentos del pais no. */
const documentoSegunTipo = (valor, form) =>
  form?.tipo_documento === "PASAPORTE"
    ? reglas.longitud({ ...authLimites.documento, etiqueta: "El documento" })(valor, form)
    : reglas.soloDigitos("El numero de documento")(valor, form);

/** Login: aqui no se valida el formato de la clave, solo que venga. */
export const loginEsquema = {
  correo: [reglas.requerido("El correo"), reglas.correo()],
  clave: [reglas.requerido("La contrasena")],
};

export const registroEsquema = {
  nombres: [
    reglas.requerido("Los nombres"),
    reglas.longitud({ ...authLimites.nombres, etiqueta: "Los nombres" }),
    reglas.soloLetras("Los nombres"),
  ],
  apellidos: [
    reglas.requerido("Los apellidos"),
    reglas.longitud({ ...authLimites.apellidos, etiqueta: "Los apellidos" }),
    reglas.soloLetras("Los apellidos"),
  ],
  tipo_documento: [
    reglas.seleccionRequerida("El tipo de documento"),
    reglas.opcionValida(authTiposDocumento, "El tipo de documento"),
  ],
  numero_documento: [
    reglas.requerido("El numero de documento"),
    documentoSegunTipo,
    reglas.longitud({ ...authLimites.documento, etiqueta: "El numero de documento" }),
  ],
  correo: [reglas.requerido("El correo"), reglas.correo()],
  telefono: [reglas.telefono({ ...authLimites.telefono })],
  clave: [reglas.clave()],
  confirmar_clave: [reglas.confirmacion("clave")],
};

export const recuperarEsquema = {
  correo: [reglas.requerido("El correo"), reglas.correo()],
};
