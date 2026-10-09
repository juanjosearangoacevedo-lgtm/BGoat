import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Checkbox } from "@/shared/components/checkbox";
import { AuthBrand } from "./AuthBrand";
import { botonDorado, campoVidrio, iconoCampo, tarjetaVidrio } from "./authEstilos";

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
  const campo = campoVidrio;

  return (
    <div className="relative w-full max-w-[520px]">
      {/* Resplandor detras del logo: los mismos colores del arcoiris del
          ojo de God's Eyes, como si el logo lo emitiera. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-14px] h-[165px] w-[220px] -translate-x-1/2 rounded-full opacity-90 blur-[26px]"
        style={{
          background:
            "conic-gradient(from 90deg, #E14F8A, #F2994A, #F2C94C, #6FCF97, #2F80ED, #9B51E0, #E14F8A)",
        }}
      />

      <div
        className={tarjetaVidrio(dark)}
      >
        <div className="flex flex-col items-center text-center">
          <AuthBrand logo="image" nombre={null} orientacion="vertical" />

        <h1 className="fuente-bienvenida mt-4 bajo:mt-2 text-[29px] font-bold leading-tight text-tinta-5 sm:text-[33px]">
          Bienvenido
        </h1>
        <p className="mt-1.5 text-[15px] text-pizarra-6">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      <form
        className="mt-7 bajo:mt-5 flex flex-col gap-4 bajo:gap-3"
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
              className={iconoCampo}
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
              className={iconoCampo}
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
              className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-pizarra-5 transition-colors hover:text-tinta-4"
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
              className="size-[18px] rounded-[5px] border-linea-10 bg-white/90 data-[state=checked]:border-dorado data-[state=checked]:bg-dorado data-[state=checked]:text-white"
            />
            <label htmlFor="remember" className="cursor-pointer text-[14px] text-pizarra-3 sm:text-[15px]">
              Recordarme
            </label>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("recover-password")}
            className="text-[13px] text-pizarra-3 transition-colors hover:text-dorado-oscuro sm:text-[15px]"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-peligro-oscuro"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className={botonDorado}
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

      <div aria-hidden="true" className="mt-8 bajo:mt-5 flex items-center">
        <span className="h-px flex-1 bg-linea-8" />
        <span className="mx-3 h-[3px] w-8 rounded-full bg-dorado-medio" />
        <span className="h-px flex-1 bg-linea-8" />
      </div>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-pizarra-6 sm:text-[12px]">
          Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad
        </p>
      </div>
    </div>
  );
}
