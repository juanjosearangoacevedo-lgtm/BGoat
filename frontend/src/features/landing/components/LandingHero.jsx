import { ArrowRight } from "lucide-react";
import {
  heroFicha,
  heroFrase,
  heroIndicadores,
  heroTexto,
  heroTitulo,
  plantaFoto,
} from "../services/landingContent";

/**
 * Hero de la landing, segun el prototipo aprobado.
 *
 * La foto es una planta de confeccion a sangre completa y el texto va
 * sobre una zona aclarada a la izquierda. Encima flota una ficha del
 * sistema: una hora de un modulo y el acumulado de la planta. Es lo que
 * la pagina tiene que decir en dos segundos: esto es tu taller, y esto
 * es lo que el sistema lee de el.
 *
 * Foto recortada del prototipo; archivo en `public/planta-hero.webp`.
 */
export function LandingHero() {
  const irAlTablero = () => {
    document.getElementById("tablero")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="fuente-bgoat relative isolate overflow-hidden bg-white">
      {/* En movil y tableta la foto ocupa toda la caja; desde lg se recuesta a la
          derecha --como en el prototipo-- y le deja el tercio izquierdo
          al texto. */}
      <img
        src={plantaFoto}
        width={1152}
        height={715}
        alt="Operaria confeccionando en una planta textil, con las telas dobladas en cada puesto"
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-[62%_42%] lg:w-[72%] lg:object-[46%_46%]"
        loading="eager"
        decoding="async"
      />

      {/* Zona clara para el contenido: velo parejo hasta tableta, porque
          el texto queda sobre la foto completa, y degradado desde lg. */}
      <div aria-hidden="true" className="absolute inset-0 bg-white/80 lg:hidden" />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            "radial-gradient(76% 58% at 2% 92%, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.86) 38%, rgba(255,255,255,0.38) 62%, rgba(255,255,255,0) 82%), " +
            "linear-gradient(to right, #ffffff 0%, #ffffff 27%, rgba(255,255,255,0.90) 37%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 61%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col px-5 pb-12 pt-10 sm:px-8 lg:min-h-[690px] lg:justify-center lg:px-12 lg:pb-16 lg:pt-14">
        <div className="max-w-[540px]">
          <span className="inline-flex items-center rounded-full bg-[#7AB396]/85 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white sm:text-[13px]">
            Sistema ERP Industrial
          </span>

          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.04] tracking-tight text-[#11221D] sm:text-[52px] xl:text-[62px]">
            {heroTitulo[0]}
            <br />
            {heroTitulo[1]}
            <br />
            <span className="text-[#C6890A]">{heroTitulo[2]}</span>
          </h1>

          <p className="mt-5 max-w-[430px] text-[17px] leading-[1.6] text-[#33423E] sm:text-[18px]">
            {heroTexto}
          </p>

          <button
            type="button"
            onClick={irAlTablero}
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#D08E10] px-7 py-3.5 text-[16px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(208,142,16,0.95)] transition-colors hover:bg-[#B67F14]"
          >
            Conoce más
            <ArrowRight className="h-[18px] w-[18px]" />
          </button>
        </div>

        <ul className="mt-10 grid max-w-[600px] grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:mt-14">
          {heroIndicadores.map(({ icon: Icon, valor, texto }) => (
            <li key={texto} className="flex flex-col items-center text-center">
              <Icon className="h-[30px] w-[30px] text-[#0F4C3F]" strokeWidth={1.7} />
              {valor && (
                <p className="mt-2.5 text-[26px] font-extrabold leading-none text-[#C6890A] sm:text-[28px]">
                  {valor}
                </p>
              )}
              <p
                className={
                  valor
                    ? "mt-1.5 text-[13px] leading-snug text-[#33423E]"
                    : "mt-2.5 text-[15px] font-medium leading-snug text-[#33423E]"
                }
              >
                {texto}
              </p>
            </li>
          ))}
        </ul>

        {/* Hasta xl la ficha va en el flujo, debajo del texto: flotando se
            sale de la pantalla o tapa a la operaria. */}
        <div className="mt-10 w-full max-w-[470px] xl:absolute xl:right-12 xl:top-16 xl:mt-0">
          <FichaProduccion />
        </div>

        <FraseTejemos />
      </div>
    </section>
  );
}

/** La hora que se acaba de registrar y el acumulado de la planta. */
function FichaProduccion() {
  const { modulo, hora, unidades, meta, avance, eficiencia, eficienciaTexto } = heroFicha;

  return (
    <div className="flex items-stretch gap-4 rounded-[20px] bg-white p-5 shadow-[0_22px_55px_-18px_rgba(12,40,32,0.45)] ring-1 ring-black/5 sm:gap-6 sm:p-6">
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-bold text-[#11221D]">{modulo}</span>
          <span className="text-[14px] text-[#7C8A87]">{hora}</span>
        </div>

        <p className="mt-2.5 text-[34px] font-extrabold leading-none text-[#11221D]">
          {unidades}
          <span className="ml-1.5 text-[16px] font-medium text-[#7C8A87]">/ {meta}</span>
        </p>

        <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-[#E3E7E4]">
          <div className="h-full rounded-full bg-[#12AD26]" style={{ width: avance + "%" }} />
        </div>

        <p className="mt-2.5 text-[13px] font-bold text-[#12AD26]">{avance}% de la meta</p>
      </div>

      <div className="w-px flex-shrink-0 bg-[#E9ECEA]" />

      <div className="flex flex-shrink-0 items-center justify-center">
        <AnilloEficiencia valor={eficiencia} texto={eficienciaTexto} />
      </div>
    </div>
  );
}

/** Anillo de eficiencia: tres verdes para lo hecho y gris para lo que falta. */
function AnilloEficiencia({ valor, texto }) {
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  const tramos = [
    { color: "#24973A", porcion: 0.264 },
    { color: "#8FCFA5", porcion: 0.264 },
    { color: "#0F4C3F", porcion: 0.263 },
  ];

  let recorrido = 0;

  return (
    <div className="relative h-[118px] w-[118px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="#DCE1DE" strokeWidth="12" />
        {tramos.map(({ color, porcion }) => {
          const largo = circunferencia * porcion;
          const desfase = recorrido;
          recorrido += largo;
          return (
            <circle
              key={color}
              cx="50"
              cy="50"
              r={radio}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={largo + " " + (circunferencia - largo)}
              strokeDashoffset={-desfase}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[20px] font-extrabold leading-none text-[#11221D]">{valor}</span>
        <span className="mt-1 text-[10.5px] font-medium leading-tight text-[#44524F]">
          {texto[0]}
          <br />
          {texto[1]}
        </span>
      </div>
    </div>
  );
}

/** Firma manuscrita sobre la foto. Es decoracion: no la leen los lectores. */
function FraseTejemos() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-10 right-14 hidden -rotate-3 select-none text-right xl:block"
    >
      <p className="fuente-manuscrita text-[44px] leading-[0.92] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
        {heroFrase[0]}
        <br />
        <span className="ml-8">{heroFrase[1]}</span>
      </p>
      <svg viewBox="0 0 220 22" className="ml-auto mt-1 h-4 w-[205px]" fill="none">
        <path d="M5 17C58 12 138 6 215 4" stroke="#E3A81B" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
