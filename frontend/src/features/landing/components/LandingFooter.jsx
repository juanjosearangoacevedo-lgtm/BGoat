import { Package } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#433A9B] text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F39A3D] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">BGoat ERP</span>
            </div>
            <p className="text-white/80 text-sm">Sistema de gestion de produccion textil profesional</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>Caracteristicas</li>
              <li>Precios</li>
              <li>Integraciones</li>
              <li>Actualizaciones</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>Documentacion</li>
              <li>Tutoriales</li>
              <li>Contacto</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>Acerca de</li>
              <li>Blog</li>
              <li>Carreras</li>
              <li>Legal</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/60">
          (c) 2026 BGoat Manufacturing ERP. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
