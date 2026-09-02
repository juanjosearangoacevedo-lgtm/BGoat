import { CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/button";

export function RegisterSuccess({
  email,
  onNavigate,
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#433A9B]/5 to-[#F39A3D]/5 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro exitoso</h2>
        <p className="text-gray-600 mb-2">
          Tu cuenta ha sido creada para <span className="font-medium text-[#433A9B]">{email}</span>.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Un administrador revisara tu solicitud y te notificara cuando tu acceso este activo.
        </p>
        <Button className="w-full h-12 bg-[#433A9B] hover:bg-[#433A9B]/90 text-white" onClick={() => onNavigate("login")}>
          Ir al inicio de sesion
        </Button>
      </div>
    </div>
  );
}
