import {
  BarChart3,
  Clock,
  Globe,
  Heart,
  Infinity as InfinitySymbol,
  Layers,
  Leaf,
  Network,
  Package,
  Shield,
  TreePine,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Contenido de la landing segun el prototipo aprobado.
 *
 * La paleta dejo de ser morada: el prototipo trabaja con verde de planta
 * y dorado. Los valores salen de muestrear el propio mockup, no de una
 * aproximacion a ojo.
 */
// Paleta muestreada del prototipo (se usa literal en cada componente):
// tinta #11221D | verde #0F4C3F | anillo #24973A / #8FCFA5 | barra #12AD26
// salvia #7AB396 | oro #D08E10 | oro hover #B67F14 | oro texto #C6890A
// texto secundario #33423E | franja #F6F8F7

/** Foto de planta del hero, recortada del prototipo. */
export const plantaFoto = "/planta-hero.webp";

/** Logotipo completo (hexagono + BGoat ERP + bajada). */
export const bgoatLogo = "/bgoat-erp-logo.webp";

/**
 * Menu del encabezado. `id` es la seccion a la que baja el enlace;
 * "Inicio" no lleva id porque sube al principio de la pagina.
 *
 * "Precios" no tiene pagina propia: el precio se cotiza, asi que el
 * enlace baja al bloque de contacto en vez de llevar a un vacio.
 */
export const landingNav = [
  { id: null, label: "Inicio" },
  { id: "tablero", label: "El tablero" },
  { id: "modulos", label: "Características" },
  { id: "testimonios", label: "Clientes" },
  { id: "contacto", label: "Precios" },
  { id: "contacto", label: "Contacto" },
];

export const heroTitulo = ["Controla hoy", "una producción", "más rentable"];

export const heroTexto =
  "De la materia prima al producto final, todo en un solo lugar. Optimiza tus procesos, controla tus recursos y haz crecer tu negocio con BGoat ERP.";

export const heroIndicadores = [
  { icon: TrendingUp, valor: "+35%", texto: "Aumento en eficiencia" },
  { icon: Users, valor: "500+", texto: "Empresas confían" },
  { icon: Clock, valor: "24/7", texto: "Soporte técnico" },
  { icon: Leaf, valor: null, texto: "Producción sostenible" },
];

/**
 * La ficha que flota sobre la foto: una hora de un modulo y el acumulado
 * de la planta. Son los mismos numeros del prototipo.
 */
export const heroFicha = {
  modulo: "MOD-01",
  hora: "11:03 am",
  unidades: 156,
  meta: 171,
  avance: 91,
  eficiencia: "79,1%",
  eficienciaTexto: ["Eficiencia", "de la planta"],
};

export const heroFrase = ["Tejemos", "oportunidades"];

/** Empresas del prototipo. Son nombres de muestra, no clientes reales. */
export const trustEmpresas = [
  { icon: TreePine, nombre: "TextilAndes" },
  { icon: InfinitySymbol, nombre: "MODATEX" },
  { icon: Layers, nombre: "HILOS DEL SUR" },
  { icon: Heart, nombre: "Confecciones Sigma" },
  { icon: Network, nombre: "Tejidos del Valle" },
];

export const trustBeneficios = [
  { icon: Leaf, lineas: ["Procesos", "eficientes"] },
  { icon: Users, lineas: ["Equipos", "más productivos"] },
  { icon: Globe, lineas: ["Industria", "más competitiva"] },
];

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
