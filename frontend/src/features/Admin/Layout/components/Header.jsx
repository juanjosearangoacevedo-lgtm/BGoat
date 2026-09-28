import { Calendar, Menu, Moon, Sun, User } from "lucide-react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { Breadcrumb } from "./Breadcrumb";

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
      className={`fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#E4E9E6] bg-white px-4 shadow-sm transition-all duration-300 ease-in-out md:px-8 ${desplazamiento}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={sidebar?.abrirMovil}
          className="rounded-lg p-2 text-[#5C6B64] transition-colors hover:bg-[#F6F8F7] lg:hidden"
          type="button"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumb currentPage={currentPage} />
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden items-center gap-2 text-sm text-[#5C6B64] xl:flex">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{currentDate}</span>
        </div>

        <button
          onClick={toggleDark}
          title={dark ? "Modo claro" : "Modo oscuro"}
          className="rounded-lg p-2 text-[#5C6B64] transition-colors hover:bg-[#F6F8F7]"
          type="button"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-3 border-l border-[#E4E9E6] pl-3 md:pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-[#12201B]">
              {usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Invitado"}
            </p>
            <p className="text-xs text-[#5C6B64]">{usuario?.nombre_rol || "Sin rol"}</p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#8FBEA9] text-white">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
