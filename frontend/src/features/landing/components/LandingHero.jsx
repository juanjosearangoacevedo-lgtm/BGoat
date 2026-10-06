import { useEffect, useState } from "react";
import { colorPorEficiencia, useFeedModulos } from "../hooks/useCicloModulo";
import {
  heroFrase,
  heroIndicadores,
  heroTitulo,
  plantaFoto,
} from "../services/landingContent";

/**
 * Hero de la landing, segun el prototipo aprobado.
 *
 * La foto es una planta de confeccion a sangre completa y el texto va
 * sobre una zona aclarada a la izquierda. Encima flotan dos fichas del
 * sistema que cuentan sus unidades hasta la meta y ceden el turno a la
 * siguiente (`useCicloModulo`). Es lo que la pagina tiene que decir en
 * dos segundos: esto es tu taller, y esto es lo que el sistema lee de el
 * en vivo.
 *
 * Foto recortada del prototipo; archivo en `public/planta-hero.jpg`.
 */
export function LandingHero() {
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
            "linear-gradient(to right, var(--blanco) 0%, var(--blanco) 27%, rgba(255,255,255,0.90) 37%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 61%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col px-5 pb-12 pt-10 sm:px-8 lg:min-h-[690px] lg:justify-center lg:px-12 lg:pb-16 lg:pt-14">
        <div className="max-w-[540px]">
          <span className="inline-flex items-center rounded-full bg-salvia/85 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white sm:text-[13px]">
            Sistema ERP Industrial
          </span>

          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.04] tracking-tight text-tinta-2 sm:text-[52px] xl:text-[62px]">
            {heroTitulo[0]}
            <br />
            {heroTitulo[1]}
            <br />
            <span className="text-dorado-oscuro">{heroTitulo[2]}</span>
          </h1>
        </div>

        <ul className="mt-10 grid max-w-[600px] grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:mt-14">
          {heroIndicadores.map(({ icon: Icon, valor, texto }) => (
            <li key={texto} className="flex flex-col items-center text-center">
              <Icon className="h-[30px] w-[30px] text-marca" strokeWidth={1.7} />
              {valor && (
                <p className="mt-2.5 text-[26px] font-extrabold leading-none text-dorado-oscuro sm:text-[28px]">
                  {valor}
                </p>
              )}
              <p
                className={
                  valor
                    ? "mt-1.5 text-[13px] leading-snug text-pizarra-1"
                    : "mt-2.5 text-[15px] font-medium leading-snug text-pizarra-1"
                }
              >
                {texto}
              </p>
            </li>
          ))}
        </ul>

        {/* Hasta xl el feed va en el flujo, debajo del texto: flotando se
            sale de la pantalla o tapa a la operaria. */}
        <div className="mt-10 w-full max-w-[470px] xl:absolute xl:right-12 xl:top-14 xl:mt-0">
          <FeedFichas />
        </div>

        <FraseTejemos />
      </div>
    </section>
  );
}

/**
 * Feed de dos fichas de produccion. `useFeedModulos` decide que modulo
 * ocupa cada puesto; esta caja solo reserva el alto de dos tarjetas
 * (con una copia invisible) para que las tarjetas reales, absolutas,
 * puedan deslizarse de un puesto a otro sin saltar el layout.
 */
function FeedFichas() {
  const { superior, unidadesSuperior, inferior, saliente } = useFeedModulos();

  return (
    <div className="relative">
      <div aria-hidden="true" className="invisible flex flex-col gap-4">
        <FichaPlantilla />
        <FichaPlantilla />
      </div>

      <div className="absolute inset-0">
        {saliente && (
          <FichaProduccion
            key={saliente.id}
            dato={saliente.dato}
            unidades={saliente.dato.unidadesFinal}
            puesto="saliente"
          />
        )}
        {inferior && (
          <FichaProduccion
            key={inferior.id}
            dato={inferior.dato}
            unidades={inferior.dato.unidadesFinal}
            puesto="inferior"
          />
        )}
        {superior && (
          <FichaProduccion
            key={superior.id}
            dato={superior.dato}
            unidades={unidadesSuperior}
            puesto="superior"
          />
        )}
      </div>
    </div>
  );
}

const ESTILO_PUESTO = {
  superior: { transform: "translateY(0)", opacity: 1 },
  inferior: { transform: "translateY(calc(100% + 1rem))", opacity: 0.82 },
  saliente: { transform: "translateY(calc(212% + 2rem))", opacity: 0 },
};

/**
 * Una tarjeta del feed. Conserva su `key` (su `id`) mientras cambia de
 * puesto, para que el cambio de `transform`/`opacity` sea una transicion
 * continua en vez de un remontaje: el mismo nodo baja de puesto o se
 * desvanece hacia afuera.
 */
function FichaProduccion({ dato, unidades, puesto }) {
  const [asentada, setAsentada] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAsentada(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const avance = Math.min(100, Math.round((unidades / dato.meta) * 100));
  const { arco, texto } = colorPorEficiencia(avance);
  const estilo = asentada
    ? ESTILO_PUESTO[puesto]
    : { transform: "translateY(-14px)", opacity: 0 };

  return (
    <div
      className="absolute inset-x-0 top-0 flex items-stretch gap-4 rounded-[20px] bg-white p-5 shadow-[0_22px_55px_-18px_rgba(12,40,32,0.45)] ring-1 ring-black/5 sm:gap-6 sm:p-6"
      style={{
        ...estilo,
        transition: "transform 480ms cubic-bezier(.22,.61,.36,1), opacity 420ms ease",
      }}
    >
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-bold text-tinta-2">{dato.modulo}</span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-salvia">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-salvia" />
            En vivo
          </span>
        </div>

        <p className="mt-2.5 text-[34px] font-extrabold leading-none text-tinta-2">
          {unidades}
          <span className="ml-1.5 text-[16px] font-medium text-pizarra-7">/ {dato.meta}</span>
        </p>

        <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-linea-4">
          <div
            className="h-full rounded-full transition-[width,background-color] duration-200"
            style={{ width: avance + "%", backgroundColor: arco }}
          />
        </div>

        <p className="mt-2.5 text-[13px] font-bold transition-colors duration-200" style={{ color: texto }}>
          {avance}% de la meta
        </p>
      </div>

      <div className="w-px flex-shrink-0 bg-linea-2" />

      <div className="flex flex-shrink-0 items-center justify-center">
        <AnilloEficiencia valor={avance} color={arco} />
      </div>
    </div>
  );
}

/** Copia invisible: solo reserva el alto de dos tarjetas en el flujo normal. */
function FichaPlantilla() {
  return (
    <div className="flex items-stretch gap-4 rounded-[20px] bg-white p-5 sm:gap-6 sm:p-6">
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-bold">MOD-00</span>
          <span className="text-[12px]">En vivo</span>
        </div>
        <p className="mt-2.5 text-[34px] font-extrabold leading-none">000</p>
        <div className="mt-3.5 h-2 rounded-full" />
        <p className="mt-2.5 text-[13px] font-bold">0% de la meta</p>
      </div>
      <div className="w-px flex-shrink-0" />
      <div className="flex flex-shrink-0 items-center justify-center">
        <div className="h-[118px] w-[118px]" />
      </div>
    </div>
  );
}

/** Anillo de eficiencia: un arco que crece con el avance y cambia de color. */
function AnilloEficiencia({ valor, color }) {
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  const largo = (circunferencia * valor) / 100;

  return (
    <div className="relative h-[118px] w-[118px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="var(--linea-7)" strokeWidth="12" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={largo + " " + (circunferencia - largo)}
          className="transition-[stroke-dasharray,stroke] duration-200 ease-linear"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[20px] font-extrabold leading-none transition-colors duration-200" style={{ color }}>
          {valor}%
        </span>
        <span className="mt-1 text-[10.5px] font-medium leading-tight text-pizarra-4">
          Eficiencia
          <br />
          del módulo
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
        <path d="M5 17C58 12 138 6 215 4" stroke="var(--dorado-claro)" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
