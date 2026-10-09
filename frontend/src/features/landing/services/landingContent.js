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
export const plantaFoto = "/planta-hero.jpg";

/** Logotipo completo (hexagono + BGoat ERP + bajada). */
// Logo oficial de BGoat, version horizontal (vector reconstruido).
export const bgoatLogo = "/bgoat-logo-horizontal.svg";

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
  { icon: Leaf, valor: null, texto: "Producción sostenible" },
];

/**
 * Modulos de muestra para la ficha animada del hero: cada uno anima sus
 * unidades desde un arranque bajo hasta `unidadesFinal`. No son datos
 * reales de produccion --la landing es publica, sin sesion-- solo
 * ilustran como el sistema lee la planta en vivo.
 */
export const heroModulosDemo = [
  { modulo: "MOD-01", meta: 171, unidadesFinal: 156 },
  { modulo: "MOD-04", meta: 160, unidadesFinal: 152 },
  { modulo: "MOD-02", meta: 140, unidadesFinal: 96 },
  { modulo: "MOD-06", meta: 185, unidadesFinal: 178 },
  { modulo: "MOD-03", meta: 150, unidadesFinal: 121 },
  { modulo: "MOD-05", meta: 165, unidadesFinal: 158 },
];

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
  { icon: Package, title: "Gestión de Órdenes", desc: "Control total de producción" },
  { icon: Users, title: "Operarios", desc: "Gestión de personal" },
  { icon: BarChart3, title: "Reportes", desc: "Análisis en tiempo real" },
  { icon: TrendingUp, title: "Productividad", desc: "Métricas y KPIs" },
  { icon: Shield, title: "Seguridad", desc: "Control de accesos" },
  { icon: Clock, title: "Tiempo Real", desc: "Monitoreo continuo" },
];

export const landingTestimonials = [
  {
    name: "María González",
    role: "Gerente de Producción",
    company: "TextilCorp",
    text: "BGoat ha revolucionado nuestra forma de gestionar la producción. La eficiencia aumento un 35%.",
  },
  {
    name: "Carlos Ramírez",
    role: "Director de Operaciones",
    company: "FashionPro",
    text: "El sistema es intuitivo y potente. Nuestros operarios se adaptaron en días.",
  },
  {
    name: "Ana Martínez",
    role: "CEO",
    company: "Confecciones Elite",
    text: "Los reportes en tiempo real nos dan control total sobre nuestra operación.",
  },
];
