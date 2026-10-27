/**
 * Documentos de identidad: como se escriben y cuando son validos.
 *
 * Es la MISMA regla que usa la pantalla (`frontend/src/shared/validations/
 * documentRules.js`). El backend la repite porque la API no puede fiarse de
 * que solo la llame el formulario: quien la use directo, o la app movil, se
 * saltaria la validacion de la pantalla. Si se cambia una, se cambia la otra;
 * `test/documentos.test.js` las compara con la misma tabla de casos.
 *
 *   CC         6 a 10 digitos
 *   TI         10 u 11 digitos
 *   CE         5 a 10 digitos
 *   NIT        8 a 10 digitos y, opcional, el digito de verificacion tras un
 *              guion (900123456-8). Si viene, se comprueba con la formula de
 *              la DIAN: un NIT inventado o mal digitado no la pasa.
 *   PASAPORTE  5 a 15 letras o numeros
 *   OTRO       5 a 15 letras o numeros
 */
const REGLAS = {
  CC: { nombre: "La cédula de ciudadanía", min: 6, max: 10, clase: "digitos" },
  TI: { nombre: "La tarjeta de identidad", min: 10, max: 11, clase: "digitos" },
  CE: { nombre: "La cédula de extranjería", min: 5, max: 10, clase: "digitos" },
  NIT: { nombre: "El NIT", min: 8, max: 10, clase: "nit" },
  PASAPORTE: { nombre: "El pasaporte", min: 5, max: 15, clase: "alfanumerico" },
  OTRO: { nombre: "El documento", min: 5, max: 15, clase: "alfanumerico" },
};

export const TIPOS_DOCUMENTO = Object.keys(REGLAS);

/** Pesos de la DIAN, de la cifra de la derecha hacia la izquierda. */
const PESOS_NIT = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

const GUIONES_RAROS = /[‐-―−]/g;

/** El digito de verificacion que le corresponde a un NIT (sin su digito). */
export function digitoVerificacionNit(base) {
  const cifras = String(base).replace(/\D/g, "").split("").reverse();
  const suma = cifras.reduce((total, cifra, posicion) => total + Number(cifra) * PESOS_NIT[posicion], 0);
  const resto = suma % 11;
  return resto > 1 ? 11 - resto : resto;
}

/**
 * Deja el numero como se guarda: sin puntos ni espacios, con solo lo que su
 * tipo admite. La pantalla lo aplica mientras se escribe (lo que no cabe no
 * aparece) y el backend antes de validar, asi "900.123.456-8" y "1.234.567"
 * pegados desde otro documento entran bien.
 */
export function normalizarDocumento(tipo, valor) {
  if (valor === undefined || valor === null) return valor;
  const texto = String(valor).trim();

  switch (REGLAS[tipo]?.clase) {
    case "digitos":
      return texto.replace(/\D/g, "");
    case "nit": {
      const limpio = texto.replace(GUIONES_RAROS, "-").replace(/[^\d-]/g, "");
      // Un solo guion, el de antes del digito de verificacion.
      const [base, ...resto] = limpio.split("-");
      return resto.length > 0 ? `${base}-${resto.join("")}` : base;
    }
    case "alfanumerico":
      return texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
    default:
      return texto;
  }
}

/**
 * Lo que hace el BACKEND antes de validar: quita solo el FORMATO (espacios,
 * puntos, comas y los guiones que el tipo no usa) y deja todo lo demas, para
 * que `validarDocumento` lo rechace. La pantalla usa `normalizarDocumento`,
 * que ademas descarta lo que no cabe mientras se escribe; la API no puede
 * hacer eso: si llega "12AB5678" a una cedula, quitar las letras guardaria
 * otro numero sin avisar.
 */
export function limpiarFormato(tipo, valor) {
  if (valor === undefined || valor === null) return valor;
  const texto = String(valor).trim();

  switch (REGLAS[tipo]?.clase) {
    case "digitos":
      return texto.replace(/[\s.,-]/g, "");
    case "nit":
      return texto.replace(GUIONES_RAROS, "-").replace(/[\s.,]/g, "");
    case "alfanumerico":
      return texto.toUpperCase().replace(/[\s.,-]/g, "");
    default:
      return texto;
  }
}

const rango = (min, max, unidad) => (min === max ? `${min} ${unidad}` : `de ${min} a ${max} ${unidad}`);

/**
 * Mensaje de lo que esta mal en el numero, o "" si esta bien (o vacio: si el
 * documento es obligatorio lo decide quien lo pide, no esta regla).
 */
export function validarDocumento(tipo, valor) {
  const regla = REGLAS[tipo];
  const numero = valor === undefined || valor === null ? "" : String(valor).trim();
  if (numero === "") return "";
  if (!regla) return "El tipo de documento no es válido";

  if (regla.clase === "nit") {
    const formato = /^(\d+)(?:-(\d))?$/.exec(numero);
    if (!formato || formato[1].length < regla.min || formato[1].length > regla.max) {
      return `${regla.nombre} debe tener ${rango(regla.min, regla.max, "dígitos")} y, si lleva dígito de verificación, separado por un guion (ejemplo: 900123456-8)`;
    }
    const [, base, digito] = formato;
    if (digito !== undefined) {
      const esperado = digitoVerificacionNit(base);
      if (Number(digito) !== esperado) {
        return `El dígito de verificación del NIT ${base} debería ser ${esperado}`;
      }
    }
    return "";
  }

  const patron = regla.clase === "digitos" ? /^\d+$/ : /^[A-Z0-9]+$/;
  if (!patron.test(numero)) {
    return `${regla.nombre} solo admite ${regla.clase === "digitos" ? "números" : "letras y números"}`;
  }
  if (numero.length < regla.min || numero.length > regla.max) {
    return `${regla.nombre} debe tener ${rango(regla.min, regla.max, regla.clase === "digitos" ? "dígitos" : "caracteres")}`;
  }
  return "";
}
