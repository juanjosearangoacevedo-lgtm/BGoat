import { CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/button";

export function RecoverPasswordSent({
  email,
  onNavigate,
}) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
      <p className="text-gray-600 text-sm mb-2">Hemos enviado las instrucciones de recuperacion a:</p>
      <p className="font-medium text-[#0F4C3F] mb-8">{email}</p>
      <p className="text-xs text-gray-400 mb-8">
        Si no ves el correo en tu bandeja de entrada, revisa la carpeta de spam o correo no deseado.
      </p>
      <Button className="w-full h-12 bg-[#D08E10] hover:bg-[#B67F14] text-white" onClick={() => onNavigate("login")}>
        Volver al inicio de sesion
      </Button>
    </div>
  );
}
