import { Card } from "@/shared/components/card";

export function LandingModulesSection({ modules }) {
  return (
    <section id="modulos" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Modulos del Sistema</h2>
        <p className="text-xl text-gray-600">Todo lo que necesitas para gestionar tu produccion</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title} className="p-6 hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-[#0F4C3F]/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#0F4C3F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
              <p className="text-gray-600">{module.desc}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
