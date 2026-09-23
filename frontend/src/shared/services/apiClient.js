/**
 * Cliente HTTP del proyecto.
 *
 * Adjunta el token de sesion, normaliza los errores del backend y avisa
 * cuando la sesion expira para que la app vuelva al login.
 */
const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const CLAVE_TOKEN = "bgoat_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLAVE_TOKEN);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(CLAVE_TOKEN, token);
  else window.localStorage.removeItem(CLAVE_TOKEN);
}

/** Error de API con el status y el detalle que devolvio el backend. */
export class ApiError extends Error {
  constructor(status, mensaje, detalle) {
    super(mensaje);
    this.status = status;
    this.detalle = detalle;
  }
}

function avisarSesionExpirada() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bgoat-sesion-expirada"));
}

async function request(path, { method = "GET", body, headers, signal } = {}) {
  const token = getToken();

  // Un FormData (la ficha tecnica del lote) viaja tal cual: el navegador
  // le pone el Content-Type con el `boundary`, que nosotros no podemos
  // calcular. Ponerlo a mano rompe la subida.
  const esFormulario = typeof FormData !== "undefined" && body instanceof FormData;

  let respuesta;
  try {
    respuesta = await fetch(`${baseUrl}${path}`, {
      method,
      signal,
      headers: {
        ...(esFormulario ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : esFormulario ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(0, "No se pudo conectar con el servidor. Verifica que la API este corriendo.");
  }

  if (respuesta.status === 204) return null;

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      setToken(null);
      avisarSesionExpirada();
    }
    throw new ApiError(
      respuesta.status,
      datos?.error || `Error ${respuesta.status} en ${method} ${path}`,
      datos?.detalle,
    );
  }

  return datos;
}

/** Agrega ?clave=valor omitiendo vacios, null y "todos"/"all". */
export function withQuery(path, params = {}) {
  const busqueda = new URLSearchParams();

  Object.entries(params).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === "") return;
    busqueda.append(clave, valor);
  });

  const cadena = busqueda.toString();
  return cadena ? `${path}?${cadena}` : path;
}

/**
 * URL completa de un archivo servido por el backend.
 *
 * La base de la API termina en `/api` y los archivos cuelgan de la raiz,
 * asi que hay que quitarle ese sufijo: `/uploads/fichas/x.jpg` ->
 * `http://localhost:4000/uploads/fichas/x.jpg`.
 */
export function archivoUrl(ruta) {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${baseUrl.replace(/\/api\/?$/, "")}${ruta}`;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),

  /** Sube un archivo con FormData. `campo` es el nombre que espera multer. */
  subir: (path, archivo, campo = "ficha", options) => {
    const datos = new FormData();
    datos.append(campo, archivo);
    return request(path, { ...options, method: "POST", body: datos });
  },
};
