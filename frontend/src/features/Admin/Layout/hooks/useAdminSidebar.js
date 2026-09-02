import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { adminMenuItems, filtrarMenu } from "../services/adminMenu";

/**
 * Estado del menu lateral: que grupos estan desplegados, cual es la opcion
 * activa y si el menu esta contraido o abierto sobre el contenido en movil.
 *
 * Lo usa el AdminLayout, que reparte el resultado entre Sidebar y Header para
 * que el contenido principal se ajuste al ancho real del menu.
 */
const CLAVE_COLAPSO = "bgoat-menu-contraido";

export function useAdminSidebar({ currentPage, onNavigate }) {
  const { puede, cerrarSesion } = useAuth();

  // El sidebar solo muestra lo que el rol del usuario puede ver.
  const menuItems = useMemo(() => filtrarMenu(adminMenuItems, puede), [puede]);

  const [expanded, setExpanded] = useState(() =>
    adminMenuItems.filter((item) => item.children).map((item) => item.label),
  );

  const [colapsado, setColapsado] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_COLAPSO) === "true";
    } catch {
      return false;
    }
  });

  const [movilAbierto, setMovilAbierto] = useState(false);

  const alternarColapso = useCallback(() => {
    setColapsado((previo) => {
      const siguiente = !previo;
      try {
        window.localStorage.setItem(CLAVE_COLAPSO, String(siguiente));
      } catch {
        // Navegar en modo privado no debe romper el menu.
      }
      return siguiente;
    });
  }, []);

  // Cambiar de pagina cierra el menu flotante de movil.
  useEffect(() => {
    setMovilAbierto(false);
  }, [currentPage]);

  // Escape cierra el menu flotante sin obligar a apuntar al fondo.
  useEffect(() => {
    if (!movilAbierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") setMovilAbierto(false);
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [movilAbierto]);

  const toggleGroup = (label) =>
    setExpanded((previous) =>
      previous.includes(label) ? previous.filter((entry) => entry !== label) : [...previous, label],
    );

  const handleItemClick = (item) => {
    if (item.children) {
      // Con el menu contraido no hay sitio para el submenu: primero se expande.
      if (colapsado) {
        setColapsado(false);
        setExpanded((previous) => (previous.includes(item.label) ? previous : [...previous, item.label]));
        return;
      }
      toggleGroup(item.label);
      return;
    }
    if (item.page) onNavigate?.(item.page);
  };

  const isExpanded = (label) => !colapsado && expanded.includes(label);

  const isItemActive = (item) =>
    Boolean(item.page && currentPage === item.page) ||
    Boolean(item.children?.some((child) => currentPage === child.page));

  const handleLogout = async () => {
    await cerrarSesion();
    onNavigate?.("login");
  };

  return {
    menuItems,
    currentPage,
    handleLogout,
    isExpanded,
    isItemActive,
    handleItemClick,
    handleChildClick: (page) => onNavigate?.(page),
    colapsado,
    alternarColapso,
    movilAbierto,
    abrirMovil: () => setMovilAbierto(true),
    cerrarMovil: () => setMovilAbierto(false),
  };
}
