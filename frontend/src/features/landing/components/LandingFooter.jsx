import { Mail, MapPin, Package, Phone } from "lucide-react";

/**
 * Pie de la landing, y el destino del enlace "Contacto" del encabezado.
 *
 * Tenia tres columnas con doce enlaces --Precios, Integraciones, Blog,
 * Carreras, FAQ...-- que no llevaban a ninguna parte porque ninguna de
 * esas paginas existe. En su lugar va lo unico que alguien busca de
 * verdad en un pie: como comunicarse, y que hay dentro del sistema.
 *
 * Los datos de contacto son marcadores: hay que reemplazarlos por los
 * reales antes de publicar.
 */
const CONTACTO = [
  { Icon: Mail, texto: "correo@tudominio.com", href: "mailto:correo@tudominio.com" },
  { Icon: Phone, texto: "+57 000 000 0000", href: "tel:+570000000000" },
  { Icon: MapPin, texto: "Colombia", href: null },
];

const INCLUYE = [
  "Captura horaria de produccion",
  "Ordenes, lotes y clientes",
  "Indicadores y reportes",
  "Control de accesos por rol",
];

export function LandingFooter() {
  return (
    <footer id="contacto" className="bg-[#0F4C3F] text-white py-12 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#D08E10] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">BGoat ERP</span>
            </div>
            <p className="text-white/80 text-sm">
              Sistema de gestion de produccion textil profesional
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Que incluye</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {INCLUYE.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-white/80">
              {CONTACTO.map(({ Icon, texto, href }) => (
                <li key={texto} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0 text-[#D08E10]" />
                  {href ? (
                    <a href={href} className="hover:text-white transition-colors">
                      {texto}
                    </a>
                  ) : (
                    <span>{texto}</span>
                  )}
                </li>
              ))}
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
