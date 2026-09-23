import { UserRound } from "lucide-react";
import { bgoatLogo, landingNav } from "../services/landingContent";

/**
 * Encabezado de la landing.
 *
 * Los enlaces llevan a secciones que existen en esta misma pagina: antes
 * eran botones sin `onClick` que no hacian nada. "Inicio" sube al
 * principio en vez de saltar al panel, que sin sesion rebota al login.
 */
export function LandingHeader({ onNavigate }) {
  const irArriba = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const irA = (id) => {
    if (!id) {
      irArriba();
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fuente-bgoat sticky top-0 z-50 border-b border-[#ECEFEC] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={irArriba}
          className="flex-shrink-0 rounded-lg"
          aria-label="Ir al inicio de la pagina"
        >
          <img
            src={bgoatLogo}
            width={542}
            height={140}
            alt="BGoat ERP, industria textil inteligente"
            className="h-9 w-auto sm:h-11 lg:h-[52px]"
          />
        </button>

        {/* En movil solo queda el boton de entrar: seis enlaces en una fila
            de 360px se apilan y rompen el encabezado. */}
        <nav className="hidden items-center gap-6 lg:flex xl:gap-9">
          {landingNav.map((seccion, indice) => {
            const activo = indice === 0;
            return (
              <button
                key={seccion.label}
                type="button"
                onClick={() => irA(seccion.id)}
                className={`relative py-1 text-[15px] transition-colors xl:text-base ${
                  activo
                    ? "font-semibold text-[#C6890A]"
                    : "text-[#1B2A27] hover:text-[#C6890A]"
                }`}
              >
                {seccion.label}
                {activo && (
                  <span className="absolute -bottom-1.5 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-[#D08E10]" />
                )}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-[#D08E10] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(208,142,16,0.9)] transition-colors hover:bg-[#B67F14] sm:px-7 sm:py-3"
        >
          <UserRound className="h-[18px] w-[18px]" />
          Iniciar Sesión
        </button>
      </div>
    </header>
  );
}
