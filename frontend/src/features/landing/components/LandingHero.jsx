import { BarChart3, ChevronRight } from "lucide-react";
import { Badge } from "@/shared/components/badge";
import { Button } from "@/shared/components/button";

export function LandingHero({ onNavigate }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#433A9B] via-[#5a4fb8] to-[#433A9B] text-white">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[#F39A3D] hover:bg-[#F39A3D]/90 text-white mb-6">
              Sistema ERP Industrial 
            </Badge>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Gestion Inteligente para tu Produccion Textil
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Optimiza tu produccion, controla tus operarios y aumenta tu productividad con BGoat Manufacturing ERP
            </p>
            <div className="flex gap-4">
              <Button onClick={() => onNavigate("login")} size="lg" className="bg-[#F39A3D] hover:bg-[#F39A3D]/90 text-white">
                Comenzar Ahora
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Ver Demo
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div>
                <p className="text-4xl font-bold text-[#F3D33B]">+35%</p>
                <p className="text-sm text-white/80">Aumento en eficiencia</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#F3D33B]">500+</p>
                <p className="text-sm text-white/80">Empresas confian</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#F3D33B]">24/7</p>
                <p className="text-sm text-white/80">Soporte tecnico</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="aspect-video bg-gradient-to-br from-[#F39A3D]/20 to-[#F3D33B]/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-32 h-32 text-white/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
