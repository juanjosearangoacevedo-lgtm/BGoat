import {
  BarChart3,
  Clock,
  Package,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

export const landingModules = [
  { icon: Package, title: "Gestion de Ordenes", desc: "Control total de produccion" },
  { icon: Users, title: "Operarios", desc: "Gestion de personal" },
  { icon: BarChart3, title: "Reportes", desc: "Analisis en tiempo real" },
  { icon: TrendingUp, title: "Productividad", desc: "Metricas y KPIs" },
  { icon: Shield, title: "Seguridad", desc: "Control de accesos" },
  { icon: Clock, title: "Tiempo Real", desc: "Monitoreo continuo" },
];

export const landingTestimonials = [
  {
    name: "Maria Gonzalez",
    role: "Gerente de Produccion",
    company: "TextilCorp",
    text: "BGoat ha revolucionado nuestra forma de gestionar la produccion. La eficiencia aumento un 35%.",
  },
  {
    name: "Carlos Ramirez",
    role: "Director de Operaciones",
    company: "FashionPro",
    text: "El sistema es intuitivo y potente. Nuestros operarios se adaptaron en dias.",
  },
  {
    name: "Ana Martinez",
    role: "CEO",
    company: "Confecciones Elite",
    text: "Los reportes en tiempo real nos dan control total sobre nuestra operacion.",
  },
];
