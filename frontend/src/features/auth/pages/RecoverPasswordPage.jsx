import { ArrowLeft, ArrowRight, MailCheck, Mail } from "lucide-react";
import { AuthEscena } from "../components/AuthEscena";
import { botonDorado, campoVidrio, iconoCampo } from "../components/authEstilos";
import { TarjetaBgoat } from "../components/TarjetaBgoat";
import { useRecoverPasswordForm } from "../hooks/useRecoverPasswordForm";

/**
 * "Recuperar contrasena", con el mismo fondo y la misma tarjeta del login
 * (diseno A aprobado) y el logo de BGoat.
 *
 * Despues de enviar dice lo mismo exista o no la cuenta, igual que el
 * backend: asi no se filtra quien esta registrado.
 */
export function RecoverPasswordPage({ onNavigate }) {
  const recover = useRecoverPasswordForm();
  const alLogin = () => onNavigate("login");

  return (
    <AuthEscena>
      {recover.sent ? (
        <TarjetaBgoat titulo="Revisa tu correo" descripcion="Si el correo está registrado, te llegó un enlace para crear una contraseña nueva.">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dorado/15">
              <MailCheck className="h-8 w-8 text-dorado-oscuro" />
            </div>
            <p className="mt-3 font-semibold text-tinta-4">{recover.email}</p>
            <p className="mt-2 text-[13px] text-pizarra-6">
              El enlace vence en 1 hora. Si no lo ves, revisa la carpeta de spam o correo no deseado.
            </p>
          </div>
          <button type="button" onClick={alLogin} className={`${botonDorado} mt-6`}>
            Volver al inicio de sesión
          </button>
        </TarjetaBgoat>
      ) : (
        <TarjetaBgoat titulo="Recuperar contraseña" descripcion="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.">
          <form onSubmit={recover.handleSubmit} className="flex flex-col gap-4 bajo:gap-3">
            <div>
              <label htmlFor="recover-email" className="sr-only">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className={iconoCampo} />
                <input
                  id="recover-email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  value={recover.email}
                  onChange={recover.handleEmailChange}
                  className={`${campoVidrio} ${recover.error ? "border-peligro" : ""}`}
                />
              </div>
              {recover.error && <p className="mt-1.5 text-[13px] text-peligro-oscuro">{recover.error}</p>}
            </div>

            <button type="submit" disabled={recover.enviando} className={botonDorado}>
              {recover.enviando ? (
                "Enviando..."
              ) : (
                <>
                  Enviar enlace
                  <ArrowRight className="h-[19px] w-[19px]" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={alLogin}
              className="flex items-center justify-center gap-2 text-[14px] text-pizarra-3 transition-colors hover:text-dorado-oscuro"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </form>
        </TarjetaBgoat>
      )}
    </AuthEscena>
  );
}
