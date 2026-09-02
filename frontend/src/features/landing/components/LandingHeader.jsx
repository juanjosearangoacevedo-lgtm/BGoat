import { Package } from "lucide-react";
import { Button } from "@/shared/components/button";

export function LandingHeader({ onNavigate }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#433A9B] to-[#F39A3D] rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">BGoat ERP</span>
        </div>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onNavigate("dashboard")}>Inicio</Button>
          <Button variant="ghost">Caracteristicas</Button>
          <Button variant="ghost">Precios</Button>
          <Button variant="ghost">Contacto</Button>
          <Button onClick={() => onNavigate("login")} className="bg-[#433A9B] hover:bg-[#433A9B]/90">
            Iniciar Sesion
          </Button>
          <Button variant="outline" className="border-[#F39A3D] text-[#F39A3D] hover:bg-[#F39A3D]/10">
            Solicitar Demo
          </Button>
        </nav>
      </div>
    </header>
  );
}
