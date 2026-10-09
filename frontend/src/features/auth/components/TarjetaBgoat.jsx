import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { bgoatLogo } from "../services/authContent";
import { tarjetaVidrio } from "./authEstilos";

/**
 * La tarjeta de vidrio de "Recuperar contrasena" y "Nueva contrasena":
 * la misma del login, con el logo de BGoat arriba, un titulo, una linea de
 * ayuda y el contenido. El resplandor dorado detras del logo es el
 * equivalente del arcoiris del login, en los colores del logo de BGoat.
 */
export function TarjetaBgoat({ titulo, descripcion, children }) {
  const { dark } = useDarkMode();

  return (
    <div className="relative w-full max-w-[480px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10px] h-[150px] w-[200px] -translate-x-1/2 rounded-full opacity-70 blur-[30px]"
        style={{ background: "radial-gradient(circle, #F6B73C 0%, #D98C14 45%, #7A5533 100%)" }}
      />

      <div className={tarjetaVidrio(dark)}>
        <div className="flex flex-col items-center text-center">
          <img
            src={bgoatLogo}
            alt="BGoat, gestión de producción"
            className="h-[118px] w-auto bajo:h-[92px]"
          />
          <h1 className="mt-4 text-[27px] font-bold leading-tight text-tinta-5 bajo:mt-2 sm:text-[30px]">
            {titulo}
          </h1>
          {descripcion && <p className="mt-1.5 max-w-[360px] text-[15px] text-pizarra-6">{descripcion}</p>}
        </div>

        <div className="mt-7 bajo:mt-5">{children}</div>
      </div>
    </div>
  );
}
