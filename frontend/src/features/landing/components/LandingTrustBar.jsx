import { trustBeneficios, trustEmpresas } from "../services/landingContent";

/**
 * Franja de cierre del hero: a quien le sirve el sistema y que gana.
 *
 * Los nombres de empresa vienen del prototipo y son de muestra: hay que
 * reemplazarlos por clientes reales antes de publicar.
 */
export function LandingTrustBar() {
  return (
    <section className="fuente-bgoat border-t border-[#E8ECE9] bg-[#F6F8F7]">
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center gap-7 lg:flex-row lg:gap-7 xl:gap-9">
          <p className="max-w-[175px] text-center text-[10.5px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-[#3C4B49] lg:text-left">
            Empresas que confían en nosotros
          </p>

          <span aria-hidden="true" className="hidden h-14 w-px bg-[#DCE3DF] lg:block" />

          <ul className="flex flex-wrap items-start justify-center gap-x-5 gap-y-5 lg:flex-1">
            {trustEmpresas.map(({ icon: Icon, nombre }) => (
              <li key={nombre} className="flex w-[96px] flex-col items-center text-center">
                <Icon className="h-[22px] w-[22px] text-[#0F4C3F]" strokeWidth={1.6} />
                <span className="mt-2 text-[12.5px] leading-tight text-[#3C4B49]">{nombre}</span>
              </li>
            ))}
          </ul>

          <span aria-hidden="true" className="hidden h-14 w-px bg-[#DCE3DF] lg:block" />

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-5 xl:gap-x-7">
            {trustBeneficios.map(({ icon: Icon, lineas }) => (
              <li key={lineas[0]} className="flex items-center gap-2">
                <Icon className="h-[26px] w-[26px] flex-shrink-0 text-[#0F4C3F]" strokeWidth={1.6} />
                <span className="text-[12.5px] leading-tight text-[#3C4B49]">
                  {lineas[0]}
                  <br />
                  {lineas[1]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
