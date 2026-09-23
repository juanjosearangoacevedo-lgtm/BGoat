import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { DarkModeProvider } from "@/shared/contexts/DarkModeContext";
import { AuthProvider, useAuth } from "@/shared/contexts/AuthContext";
import { AdminLayout } from "@/features/Admin/Layout/components/AdminLayout";
import { defaultPage, isPublicPage, resolveRoute } from "@/routes";

function AppInner() {
  const { autenticado, cargando } = useAuth();
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [pageData, setPageData] = useState(null);

  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    setPageData(data);
  };

  // Si la sesion se cae (token vencido), la app vuelve al login.
  useEffect(() => {
    if (!cargando && !autenticado && !isPublicPage(currentPage)) {
      setCurrentPage("login");
      setPageData(null);
    }
  }, [autenticado, cargando, currentPage]);

  // Al recargar con sesion activa se entra al panel, no a la pagina publica.
  useEffect(() => {
    if (!cargando && autenticado && (currentPage === defaultPage || currentPage === "login")) {
      setCurrentPage("panel");
    }
    // Solo al terminar de rehidratar la sesion: despues el usuario navega libre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, autenticado]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-400">
        Cargando BGoat...
      </div>
    );
  }

  const route = resolveRoute(currentPage);
  const Page = route.component;
  const pageProps = { onNavigate: handleNavigate, ...(route.props?.(pageData) || {}) };

  // Las paginas publicas van sueltas; las del panel, dentro del layout.
  // El aviso flotante es el mismo en las dos, y estaba escrito dos veces.
  return (
    <>
      {isPublicPage(currentPage) ? (
        <Page {...pageProps} />
      ) : (
        <AdminLayout onNavigate={handleNavigate} currentPage={currentPage}>
          <Page {...pageProps} />
        </AdminLayout>
      )}
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </DarkModeProvider>
  );
}
