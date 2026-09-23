import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Checkbox } from "@/shared/components/checkbox";
import { authMarca } from "../services/authContent";
import { AuthBrand } from "./AuthBrand";

/**
 * Tarjeta del login, sobre la foto de la planta.
 *
 * El formulario es el mismo de antes --mismos campos, mismo envio, mismo
 * manejo de error--; lo que cambio es la presentacion: vidrio claro
 * centrado en pantalla, como en el prototipo aprobado.
 *
 * Las etiquetas siguen ahi pero ocultas a la vista: el prototipo muestra
 * solo el icono dentro del campo, y un campo sin etiqueta no lo puede
 * leer quien navega con lector de pantalla.
 */
export function LoginFormPanel({
  dark,
  email,
  password,
  showPassword,
  error,
  cargando,
  onEmailChange,
  onNavigate,
  onPasswordChange,
  onSubmit,
  onTogglePassword,
}) {
  const campo =
    "h-[56px] w-full rounded-[14px] border border-white/70 bg-white/92 pl-[52px] pr-4 text-[15px] text-[#16232B] shadow-[0_2px_10px_-4px_rgba(14,38,32,0.25)] outline-none transition placeholder:text-[#93A0A7] focus:border-[#D08E10] focus:ring-4 focus:ring-[#D08E10]/20";

  return (
    <div
      className={`fuente-bgoat w-full max-w-[520px] rounded-[26px] border border-white/60 p-6 shadow-[0_34px_90px_-24px_rgba(6,24,19,0.62)] backdrop-blur-xl sm:p-10 ${
        dark ? "bg-white/74" : "bg-white/84"
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <AuthBrand logo="image" nombre={authMarca} orientacion="vertical" />

        <h1 className="mt-4 text-[27px] font-bold leading-tight text-[#12263B] sm:text-[31px]">
          Bienvenido de nuevo
        </h1>
        <p className="mt-1.5 text-[15px] text-[#55636E]">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      <form
        className="mt-7 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label htmlFor="email" className="sr-only">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-[18px] top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#54636C]"
            />
            <input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className={campo}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-[18px] top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#54636C]"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              required
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className={campo + " pr-[52px]"}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-[#54636C] transition-colors hover:text-[#16232B]"
            >
              {showPassword ? (
                <EyeOff className="h-[19px] w-[19px]" />
              ) : (
                <Eye className="h-[19px] w-[19px]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="remember"
              className="size-[18px] rounded-[5px] border-[#B9C2C7] bg-white/90 data-[state=checked]:border-[#D08E10] data-[state=checked]:bg-[#D08E10] data-[state=checked]:text-white"
            />
            <label htmlFor="remember" className="cursor-pointer text-[14px] text-[#3D4A53] sm:text-[15px]">
              Recordarme
            </label>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("recover-password")}
            className="text-[13px] text-[#3D4A53] transition-colors hover:text-[#C6890A] sm:text-[15px]"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-[#c02626]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="mt-1 flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#C8901F] text-[16px] font-semibold text-white shadow-[0_16px_34px_-14px_rgba(200,144,31,0.95)] transition-colors hover:bg-[#B67F14] disabled:cursor-wait disabled:opacity-70"
        >
          {cargando ? (
            "Ingresando..."
          ) : (
            <>
              Iniciar Sesión
              <ArrowRight className="h-[19px] w-[19px]" />
            </>
          )}
        </button>
      </form>

      <div aria-hidden="true" className="mt-8 flex items-center">
        <span className="h-px flex-1 bg-[#C9D1CE]" />
        <span className="mx-3 h-[3px] w-8 rounded-full bg-[#C8901F]" />
        <span className="h-px flex-1 bg-[#C9D1CE]" />
      </div>

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-[#55636E] sm:text-[12px]">
        Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad
      </p>
    </div>
  );
}
