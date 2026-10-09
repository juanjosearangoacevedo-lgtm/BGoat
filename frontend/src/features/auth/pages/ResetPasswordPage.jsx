import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { AuthEscena } from "../components/AuthEscena";
import { botonDorado, campoVidrio, iconoCampo } from "../components/authEstilos";
import { TarjetaBgoat } from "../components/TarjetaBgoat";
import { useResetPasswordForm } from "../hooks/useResetPasswordForm";

const CAMPOS = [
  { campo: "clave", etiqueta: "Contrasena nueva" },
  { campo: "confirmar_clave", etiqueta: "Repite la contrasena" },
];

/**
 * Pantalla a la que llega el enlace del correo de recuperacion: se escribe
 * la contrasena nueva dos veces. Mismo fondo y misma tarjeta que el login
 * y "Recuperar contrasena" (diseno A).
 */
export function ResetPasswordPage({ token, onNavigate }) {
  const reset = useResetPasswordForm(token);
  const alLogin = () => onNavigate("login");
  const pedirOtro = () => onNavigate("recover-password");

  return (
    <AuthEscena>
      {reset.listo ? (
        <TarjetaBgoat titulo="Contrasena actualizada" descripcion="Ya puedes iniciar sesion con tu contrasena nueva.">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-exito/15">
              <CheckCircle2 className="h-8 w-8 text-exito" />
            </div>
          </div>
          <button type="button" onClick={alLogin} className={`${botonDorado} mt-6`}>
            Iniciar sesion
          </button>
        </TarjetaBgoat>
      ) : reset.sinToken ? (
        <TarjetaBgoat titulo="Enlace incompleto" descripcion="Abre el enlace completo que llego a tu correo, o pide uno nuevo.">
          <button type="button" onClick={pedirOtro} className={botonDorado}>
            Pedir un enlace nuevo
          </button>
        </TarjetaBgoat>
      ) : (
        <TarjetaBgoat titulo="Nueva contrasena" descripcion="Escribe tu contrasena nueva dos veces. Debe tener al menos 8 caracteres.">
          <form onSubmit={reset.handleSubmit} className="flex flex-col gap-4 bajo:gap-3">
            {CAMPOS.map(({ campo, etiqueta }) => (
              <div key={campo}>
                <label htmlFor={`reset-${campo}`} className="sr-only">
                  {etiqueta}
                </label>
                <div className="relative">
                  <Lock aria-hidden="true" className={iconoCampo} />
                  <input
                    id={`reset-${campo}`}
                    type="password"
                    placeholder={etiqueta}
                    autoComplete="new-password"
                    value={reset.form[campo]}
                    onChange={(event) => reset.setCampo(campo, event.target.value)}
                    className={`${campoVidrio} ${reset.errores[campo] ? "border-peligro" : ""}`}
                  />
                </div>
                {reset.errores[campo] && (
                  <p className="mt-1.5 text-[13px] text-peligro-oscuro">{reset.errores[campo]}</p>
                )}
              </div>
            ))}

            {reset.error && (
              <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-peligro-oscuro">
                {reset.error}
                <button type="button" onClick={pedirOtro} className="mt-1 block font-semibold underline">
                  Pedir un enlace nuevo
                </button>
              </div>
            )}

            <button type="submit" disabled={reset.enviando} className={botonDorado}>
              {reset.enviando ? "Guardando..." : "Guardar contrasena"}
            </button>

            <button
              type="button"
              onClick={alLogin}
              className="flex items-center justify-center gap-2 text-[14px] text-pizarra-3 transition-colors hover:text-dorado-oscuro"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesion
            </button>
          </form>
        </TarjetaBgoat>
      )}
    </AuthEscena>
  );
}
