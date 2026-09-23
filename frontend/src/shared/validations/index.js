/**
 * Reglas de validacion compartidas.
 *
 * Cada modulo arma su esquema en `features/<modulo>/validations/` combinando
 * estas reglas; ninguna pagina ni componente deberia escribir la logica de
 * validacion en linea.
 *
 *   import { reglas, validarFormulario } from "@/shared/validations";
 *
 *   export const clienteEsquema = {
 *     nombre: [reglas.requerido("El nombre"), reglas.longitud({ max: 60 })],
 *   };
 */
import * as texto from "./textValidation";
import * as email from "./emailValidation";
import * as numeros from "./numberValidation";
import * as fechas from "./dateValidation";
import * as claves from "./passwordValidation";
import * as selects from "./selectValidation";

export { estaVacio, concordar, validarFormulario, esValido, combinarEsquemas } from "./formValidation";
export { esCorreoValido, LARGO_MAXIMO_CORREO } from "./emailValidation";
export { LARGO_MINIMO_CLAVE, LARGO_MAXIMO_CLAVE } from "./passwordValidation";

/** Todas las reglas bajo un mismo nombre, para no importar seis archivos. */
export const reglas = {
  // Texto
  requerido: texto.requerido,
  longitud: texto.longitud,
  soloLetras: texto.soloLetras,
  sinCaracteresEspeciales: texto.sinCaracteresEspeciales,
  patron: texto.patron,
  unico: texto.unico,

  // Correo
  correo: email.correo,

  // Numeros
  numero: numeros.numero,
  entero: numeros.entero,
  noNegativo: numeros.noNegativo,
  mayorQueCero: numeros.mayorQueCero,
  soloDigitos: numeros.soloDigitos,
  digitos: numeros.digitos,
  telefono: numeros.telefono,
  noMenorQue: numeros.noMenorQue,
  noMayorQue: numeros.noMayorQue,

  // Fechas
  fecha: fechas.fecha,
  noFutura: fechas.noFutura,
  noPasada: fechas.noPasada,
  entreFechas: fechas.entre,
  posteriorA: fechas.posteriorA,
  anteriorA: fechas.anteriorA,
  edad: fechas.edad,

  // Contrasenas
  clave: claves.clave,
  confirmacion: claves.confirmacion,
  igualA: claves.igualA,

  // Seleccion
  seleccionRequerida: selects.seleccionRequerida,
  opcionValida: selects.opcionValida,
  seleccionMinima: selects.seleccionMinima,
  requeridoSi: selects.requeridoSi,
};
