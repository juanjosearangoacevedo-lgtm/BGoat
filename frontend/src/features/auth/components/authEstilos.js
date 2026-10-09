/**
 * Las piezas visuales que comparten las tarjetas de acceso (login,
 * recuperar y nueva contrasena), para que se vean iguales.
 */

/** La tarjeta de vidrio claro sobre la foto. Es clara en los dos modos. */
export const tarjetaVidrio = (dark) =>
  `relative w-full rounded-[26px] border border-white/60 p-6 shadow-[0_34px_90px_-24px_rgba(6,24,19,0.62)] backdrop-blur-xl sm:p-10 sm:bajo:px-9 sm:bajo:py-6 ${
    dark ? "bg-white/74" : "bg-white/84"
  }`;

/** Campo de texto con el icono adentro, a la izquierda. */
export const campoVidrio =
  "h-[56px] w-full rounded-[14px] border border-white/70 bg-white/92 pl-[52px] pr-4 text-[15px] text-tinta-4 shadow-[0_2px_10px_-4px_rgba(14,38,32,0.25)] outline-none transition placeholder:text-pizarra-8 focus:border-dorado focus:ring-4 focus:ring-dorado/20";

/** El icono que va dentro del campo. */
export const iconoCampo =
  "pointer-events-none absolute left-[18px] top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-pizarra-5";

/** El boton dorado principal. */
export const botonDorado =
  "mt-1 flex h-[58px] bajo:h-[50px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-dorado-medio text-[16px] font-semibold text-white shadow-[0_16px_34px_-14px_rgba(200,144,31,0.95)] transition-colors hover:bg-dorado-hover disabled:cursor-wait disabled:opacity-70";
