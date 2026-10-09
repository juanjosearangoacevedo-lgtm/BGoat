import { UserRound } from "lucide-react";
import { bgoatLogo } from "../services/landingContent";

/** Encabezado de la landing: solo el logo y el acceso al login. */
export function LandingHeader({ onNavigate }) {
  const irArriba = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <header className="fuente-bgoat sticky top-0 z-50 border-b border-linea-5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={irArriba}
          className="flex-shrink-0 rounded-lg"
          aria-label="Ir al inicio de la pagina"
        >
          <img
            src={bgoatLogo}
            width={470}
            height={118}
            alt="BGoat, gestion de produccion"
            className="h-10 w-auto sm:h-12 lg:h-[54px]"
          />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border-2 border-marca bg-transparent px-5 py-2.5 text-[15px] font-semibold text-marca-letra transition-colors hover:bg-marca hover:text-white sm:px-7 sm:py-3"
        >
          <UserRound className="h-[18px] w-[18px]" />
          Iniciar Sesión
        </button>
      </div>
    </header>
  );
}
