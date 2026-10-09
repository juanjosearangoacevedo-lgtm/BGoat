import { useEffect } from "react";
import { useAdminSidebar } from "../hooks/useAdminSidebar";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * Estructura del panel: menu lateral, cabecera fija y contenido.
 *
 * El estado del menu vive aqui para que el contenido y la cabecera se ajusten
 * al ancho real del sidebar cuando el usuario lo contrae.
 */
export function AdminLayout({ children, currentPage, onNavigate }) {
  // El modo oscuro del panel (`html.dark.en-panel` en paleta.css) se
  // activa solo mientras se esta dentro del panel. Va en <html> y no en
  // este div para que tambien lo vean los modales, que se pintan fuera.
  useEffect(() => {
    document.documentElement.classList.add("en-panel");
    return () => document.documentElement.classList.remove("en-panel");
  }, []);

  const sidebar = useAdminSidebar({ currentPage, onNavigate });
  const margen = sidebar.colapsado ? "lg:ml-20" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-fondo">
      <Sidebar sidebar={sidebar} />
      <Header sidebar={sidebar} currentPage={currentPage} />

      <main className={`min-h-screen pt-16 transition-all duration-300 ease-in-out ${margen}`}>
        {children}
        <Footer />
      </main>
    </div>
  );
}
