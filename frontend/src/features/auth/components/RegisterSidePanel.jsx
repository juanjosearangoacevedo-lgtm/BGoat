import { Factory } from "lucide-react";
import { registerBenefits } from "../services/authContent";

export function RegisterSidePanel() {
  return (
    <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#0F4C3F] to-[#1B6B55] p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="relative z-10 text-white max-w-md">
        <Factory className="w-20 h-20 mb-6 text-[#D08E10]" />
        <h2 className="text-4xl font-bold mb-4">Unete al equipo GOD'S EYES SAS</h2>
        <p className="text-xl text-white/90 mb-8">
          Accede a todas las herramientas de gestion textil desde un solo sistema integrado
        </p>
        <div className="space-y-4">
          {registerBenefits.map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <p className="text-white/90">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
