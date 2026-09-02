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
  const sidebar = useAdminSidebar({ currentPage, onNavigate });
  const margen = sidebar.colapsado ? "lg:ml-20" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar sidebar={sidebar} />
      <Header sidebar={sidebar} currentPage={currentPage} />

      <main className={`min-h-screen pt-16 transition-all duration-300 ease-in-out ${margen}`}>
        {children}
        <Footer />
      </main>
    </div>
  );
}
