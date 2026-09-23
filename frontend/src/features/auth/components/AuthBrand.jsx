import { Package } from "lucide-react";
import { authLogo } from "../services/authContent";

/**
 * Marca de las pantallas de acceso.
 *
 * El login entra con el logo y el nombre de God's Eyes S.A.S., en
 * columna y centrado; registro y recuperacion siguen con la marca del
 * producto en fila, como estaban.
 */
export function AuthBrand({
  logo = "gradient",
  textColor = "text-gray-900",
  nombre = "BGoat ERP",
  orientacion = "horizontal",
}) {
  const vertical = orientacion === "vertical";

  return (
    <div className={vertical ? "flex flex-col items-center" : "flex items-center gap-3"}>
      {logo === "image" ? (
        <img
          src={authLogo}
          alt={nombre + " logo"}
          className={
            vertical
              ? "h-[104px] w-[104px] flex-shrink-0 rounded-2xl object-contain sm:h-28 sm:w-28"
              : "h-12 w-12 flex-shrink-0 rounded-full object-contain"
          }
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F4C3F] to-[#0F4C3F]">
          <Package className="h-7 w-7 text-white" />
        </div>
      )}
      <span
        className={
          vertical
            ? "mt-3 text-[22px] font-bold tracking-tight text-[#16232B] sm:text-[26px]"
            : `text-2xl font-bold ${textColor}`
        }
      >
        {nombre}
      </span>
    </div>
  );
}
