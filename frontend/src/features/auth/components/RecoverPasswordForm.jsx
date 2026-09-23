import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";

export function RecoverPasswordForm({
  email,
  error,
  enviando = false,
  onEmailChange,
  onNavigate,
  onSubmit,
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar contrasena</h1>
        <p className="text-gray-600 text-sm">
          Ingresa tu correo corporativo y te enviaremos las instrucciones para restablecer tu contrasena.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="recover-email">Correo electronico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="recover-email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={onEmailChange}
              className={`h-12 pl-10 ${error ? "border-red-400" : ""}`}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={enviando}
          className="w-full h-12 bg-[#D08E10] hover:bg-[#B67F14] text-white"
        >
          {enviando ? "Enviando..." : "Enviar instrucciones"}
        </Button>

        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#0F4C3F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesion
        </button>
      </form>
    </>
  );
}
