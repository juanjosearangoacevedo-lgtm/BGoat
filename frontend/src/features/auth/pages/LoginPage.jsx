import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { AuthEscena } from "../components/AuthEscena";
import { LoginFormPanel } from "../components/LoginFormPanel";
import { useLoginForm } from "../hooks/useLoginForm";
import { authFrases } from "../services/authContent";

/**
 * Login a pantalla completa, segun el prototipo aprobado.
 *
 * La foto de la planta, el velo y el boton de volver son `AuthEscena`, el
 * mismo fondo de "Recuperar contrasena" y "Nueva contrasena". Aqui solo
 * se agregan las frases manuscritas y la tarjeta del login.
 */
export function LoginPage({ onNavigate }) {
  const { dark } = useDarkMode();
  const login = useLoginForm(onNavigate);

  return (
    <AuthEscena
      volver={{ texto: "Volver al inicio", onClick: () => onNavigate("landing") }}
      decoracion={
        <>
          <FraseManuscrita
            lineas={authFrases.izquierda}
            className="bottom-16 left-10 -rotate-6 text-left"
          />
          <FraseManuscrita
            lineas={authFrases.derecha}
            className="bottom-12 right-14 -rotate-3 text-right"
          />
        </>
      }
    >
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
    </AuthEscena>
  );
}

/** Firma manuscrita sobre la foto. Decoracion: se esconde en pantallas chicas. */
function FraseManuscrita({ lineas, className }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden select-none xl:block ${className}`}
    >
      <p className="text-[27px] font-semibold italic leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        {lineas[0]}
        <br />
        {lineas[1]}
      </p>
      <svg viewBox="0 0 220 22" className="mt-1 h-4 w-[190px]" fill="none">
        <path d="M5 17C58 12 138 6 215 4" stroke="var(--dorado-claro)" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
