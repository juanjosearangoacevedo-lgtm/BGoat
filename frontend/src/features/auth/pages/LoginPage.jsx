import { ArrowLeft } from "lucide-react";
import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { AuthThemeToggle } from "../components/AuthThemeToggle";
import { LoginFormPanel } from "../components/LoginFormPanel";
import { useLoginForm } from "../hooks/useLoginForm";
import { authFoto, authFrases } from "../services/authContent";

/**
 * Login a pantalla completa, segun el prototipo aprobado.
 *
 * La foto de la planta ocupa toda la pantalla, desenfocada, y el
 * formulario va en una tarjeta de vidrio en el centro. El modo oscuro
 * sigue siendo el de la app: aqui solo oscurece el velo de la foto,
 * porque la tarjeta del prototipo es clara en los dos modos.
 */
const velos = {
  claro:
    "radial-gradient(120% 95% at 50% 38%, rgba(255,252,244,0.12) 0%, rgba(11,30,24,0.34) 100%), linear-gradient(180deg, rgba(255,248,235,0.10) 0%, rgba(9,25,20,0.30) 100%)",
  oscuro:
    "radial-gradient(120% 95% at 50% 38%, rgba(10,24,20,0.40) 0%, rgba(6,17,14,0.72) 100%), linear-gradient(180deg, rgba(6,17,14,0.45) 0%, rgba(4,12,10,0.72) 100%)",
};

export function LoginPage({ onNavigate }) {
  const { dark, toggleDark } = useDarkMode();
  const login = useLoginForm(onNavigate);

  return (
    <div className="fuente-bgoat relative min-h-screen w-full overflow-hidden bg-[#0F1A17]">
      <img
        src={authFoto}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 select-none object-cover object-center blur-[7px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: dark ? velos.oscuro : velos.claro }}
      />

      {/* La salida. Sin esto, quien entra al login desde la landing solo
          puede volver con el boton del navegador: la app no usa rutas,
          asi que no hay URL a la que devolverse a mano. */}
      <button
        type="button"
        onClick={() => onNavigate("landing")}
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3.5 py-2 text-[13px] text-white/90 backdrop-blur-sm transition-colors hover:bg-black/40 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={14} />
        Volver al inicio
      </button>

      <AuthThemeToggle dark={dark} onToggle={toggleDark} color="#ffffff" />

      <FraseManuscrita
        lineas={authFrases.izquierda}
        className="bottom-16 left-10 -rotate-6 text-left"
      />
      <FraseManuscrita
        lineas={authFrases.derecha}
        className="bottom-12 right-14 -rotate-3 text-right"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <LoginFormPanel
          dark={dark}
          email={login.email}
          password={login.password}
          showPassword={login.showPassword}
          error={login.error}
          cargando={login.cargando}
          onEmailChange={login.setEmail}
          onNavigate={onNavigate}
          onPasswordChange={login.setPassword}
          onSubmit={login.handleLogin}
          onTogglePassword={() => login.setShowPassword((value) => !value)}
        />
      </div>
    </div>
  );
}

/** Firma manuscrita sobre la foto. Decoracion: se esconde en pantallas chicas. */
function FraseManuscrita({ lineas, className }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden select-none xl:block ${className}`}
    >
      <p className="fuente-manuscrita text-[36px] leading-[1.05] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        {lineas[0]}
        <br />
        {lineas[1]}
      </p>
      <svg viewBox="0 0 220 22" className="mt-1 h-4 w-[190px]" fill="none">
        <path d="M5 17C58 12 138 6 215 4" stroke="#E3A81B" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
