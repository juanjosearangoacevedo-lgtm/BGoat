import { ArrowLeft } from "lucide-react";
import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { authFoto } from "../services/authContent";
import { AuthThemeToggle } from "./AuthThemeToggle";

/**
 * El fondo de las pantallas de acceso (login, recuperar y nueva
 * contrasena): la foto de la planta a pantalla completa, desenfocada, con
 * un velo encima y la tarjeta en el centro. Asi las tres se ven como una
 * sola familia.
 *
 * El modo oscuro sigue siendo el de la app: aqui solo oscurece el velo de
 * la foto, porque la tarjeta es clara en los dos modos.
 */
const velos = {
  claro:
    "radial-gradient(120% 95% at 50% 38%, rgba(255,252,244,0.12) 0%, rgba(11,30,24,0.34) 100%), linear-gradient(180deg, rgba(255,248,235,0.10) 0%, rgba(9,25,20,0.30) 100%)",
  oscuro:
    "radial-gradient(120% 95% at 50% 38%, rgba(10,24,20,0.40) 0%, rgba(6,17,14,0.72) 100%), linear-gradient(180deg, rgba(6,17,14,0.45) 0%, rgba(4,12,10,0.72) 100%)",
};

export function AuthEscena({ volver, decoracion = null, children }) {
  const { dark, toggleDark } = useDarkMode();

  return (
    <div className="fuente-bgoat relative h-dvh w-full overflow-hidden bg-tinta-3">
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

      {/* La salida. La app no usa rutas, asi que sin este boton solo se
          puede volver con el boton del navegador. */}
      {volver && (
        <button
          type="button"
          onClick={volver.onClick}
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3.5 py-2 text-[13px] text-white/90 backdrop-blur-sm transition-colors hover:bg-black/40 hover:text-white sm:left-6 sm:top-6"
        >
          <ArrowLeft size={14} />
          {volver.texto}
        </button>
      )}

      <AuthThemeToggle dark={dark} onToggle={toggleDark} color="var(--blanco)" />

      {decoracion}

      {/* El fondo (foto ampliada al 110%) se queda recortado en la pantalla;
          solo el contenido puede desplazarse, y sin barra visible. */}
      <div className="sin-barra absolute inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-10 bajo:py-4 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
