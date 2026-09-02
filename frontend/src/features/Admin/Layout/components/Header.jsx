import { Calendar, Menu, User } from "lucide-react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { Breadcrumb } from "./Breadcrumb";

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Cabecera fija del panel.
 * Se corre con el menu lateral y, en pantallas pequenas, ofrece el boton que
 * lo hace aparecer sobre el contenido.
 */
export function Header({ currentPage, sidebar }) {
  const { dark, toggleDark } = useDarkMode();
  const { usuario } = useAuth();
  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const desplazamiento = sidebar?.colapsado ? "lg:left-20" : "lg:left-64";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 shadow-sm transition-all duration-300 ease-in-out md:px-8 ${desplazamiento}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={sidebar?.abrirMovil}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
          type="button"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumb currentPage={currentPage} />
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden items-center gap-2 text-sm text-gray-600 xl:flex">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{currentDate}</span>
        </div>

        <button
          onClick={toggleDark}
          title={dark ? "Modo claro" : "Modo oscuro"}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          style={{ color: dark ? "#A78BFA" : "#433A9B" }}
          type="button"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-3 md:pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">
              {usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Invitado"}
            </p>
            <p className="text-xs text-gray-500">{usuario?.nombre_rol || "Sin rol"}</p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#433A9B] to-[#F39A3D] text-white">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
