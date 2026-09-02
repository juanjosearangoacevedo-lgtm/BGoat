import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, getToken, setToken } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

const AuthContext = createContext(null);

/**
 * Sesion del usuario y sus permisos.
 *
 * Los permisos llegan del backend como pares { modulo, accion } leidos de
 * `rol_permiso`, y son los mismos que protegen cada ruta de la API.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const limpiarSesion = useCallback(() => {
    setToken(null);
    setUsuario(null);
    setPermisos([]);
  }, []);

  // Rehidrata la sesion al abrir la app.
  useEffect(() => {
    let activo = true;

    (async () => {
      if (!getToken()) {
        setCargando(false);
        return;
      }
      try {
        const datos = await apiClient.get(endpoints.perfil);
        if (!activo) return;
        setUsuario(datos.usuario);
        setPermisos(datos.permisos || []);
      } catch {
        limpiarSesion();
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [limpiarSesion]);

  // El apiClient avisa cuando el token vence.
  useEffect(() => {
    const alExpirar = () => limpiarSesion();
    window.addEventListener("bgoat-sesion-expirada", alExpirar);
    return () => window.removeEventListener("bgoat-sesion-expirada", alExpirar);
  }, [limpiarSesion]);

  const iniciarSesion = useCallback(async (correo, clave) => {
    const datos = await apiClient.post(endpoints.login, { correo, clave });
    setToken(datos.token);
    setUsuario(datos.usuario);
    setPermisos(datos.permisos || []);
    return datos.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await apiClient.post(endpoints.logout, {});
    } catch {
      // Aunque falle el registro de auditoria, la sesion local se cierra.
    }
    limpiarSesion();
  }, [limpiarSesion]);

  const clavesPermisos = useMemo(
    () => new Set(permisos.map((permiso) => `${permiso.modulo}|${permiso.accion}`)),
    [permisos],
  );

  /** ¿El rol del usuario tiene esta accion sobre este modulo? */
  const puede = useCallback(
    (modulo, accion = "VER") => clavesPermisos.has(`${modulo}|${accion}`),
    [clavesPermisos],
  );

  const valor = useMemo(
    () => ({
      usuario,
      permisos,
      cargando,
      autenticado: Boolean(usuario),
      iniciarSesion,
      cerrarSesion,
      puede,
    }),
    [usuario, permisos, cargando, iniciarSesion, cerrarSesion, puede],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}
