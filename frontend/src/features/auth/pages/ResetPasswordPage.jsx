import { ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { AuthBrand } from "../components/AuthBrand";
import { useResetPasswordForm } from "../hooks/useResetPasswordForm";

const CAMPOS = [
  { campo: "clave", etiqueta: "Contrasena nueva" },
  { campo: "confirmar_clave", etiqueta: "Repite la contrasena" },
];

/**
 * Pantalla a la que llega el enlace del correo de recuperacion: se escribe
 * la contrasena nueva dos veces. Mismo marco que "Recuperar contrasena".
 */
export function ResetPasswordPage({ token, onNavigate }) {
  const reset = useResetPasswordForm(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca/5 via-white to-marca/5 p-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-10 shadow-xl">
          <div className="mb-8">
            <AuthBrand />
          </div>

          {reset.listo ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Contrasena actualizada</h1>
              <p className="mb-8 text-sm text-gray-600">Ya puedes iniciar sesion con tu contrasena nueva.</p>
              <Button
                className="h-12 w-full bg-dorado text-white hover:bg-dorado-hover"
                onClick={() => onNavigate("login")}
              >
                Iniciar sesion
              </Button>
            </div>
          ) : reset.sinToken ? (
            <div className="text-center">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Enlace incompleto</h1>
              <p className="mb-8 text-sm text-gray-600">
                Abre el enlace completo que llego a tu correo, o pide uno nuevo.
              </p>
              <Button
                className="h-12 w-full bg-dorado text-white hover:bg-dorado-hover"
                onClick={() => onNavigate("recover-password")}
              >
                Pedir un enlace nuevo
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Nueva contrasena</h1>
                <p className="text-sm text-gray-600">
                  Escribe tu contrasena nueva. Debe tener al menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={reset.handleSubmit} className="space-y-5">
                {CAMPOS.map(({ campo, etiqueta }) => (
                  <div key={campo} className="space-y-2">
                    <Label htmlFor={`reset-${campo}`}>{etiqueta}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id={`reset-${campo}`}
                        type="password"
                        autoComplete="new-password"
                        value={reset.form[campo]}
                        onChange={(event) => reset.setCampo(campo, event.target.value)}
                        className={`h-12 pl-10 ${reset.errores[campo] ? "border-red-400" : ""}`}
                      />
                    </div>
                    {reset.errores[campo] && <p className="text-xs text-red-500">{reset.errores[campo]}</p>}
                  </div>
                ))}

                {reset.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {reset.error}
                    <button
                      type="button"
                      onClick={() => onNavigate("recover-password")}
                      className="mt-1 block font-medium underline"
                    >
                      Pedir un enlace nuevo
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={reset.enviando}
                  className="h-12 w-full bg-dorado text-white hover:bg-dorado-hover"
                >
                  {reset.enviando ? "Guardando..." : "Guardar contrasena"}
                </Button>

                <button
                  type="button"
                  onClick={() => onNavigate("login")}
                  className="flex w-full items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-marca"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesion
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
