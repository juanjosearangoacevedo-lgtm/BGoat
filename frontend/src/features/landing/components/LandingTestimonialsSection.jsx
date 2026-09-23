import { Award } from "lucide-react";
import { Card } from "@/shared/components/card";

export function LandingTestimonialsSection({ testimonials }) {
  return (
    <section id="testimonios" className="bg-gray-100 py-20 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros clientes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6 bg-white">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, index) => (
                  <Award key={index} className="w-4 h-4 text-[#D08E10] fill-[#D08E10]" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
              <div>
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
                <p className="text-sm text-[#0F4C3F]">{testimonial.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
