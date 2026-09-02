import { LandingFooter } from "../components/LandingFooter";
import { LandingHeader } from "../components/LandingHeader";
import { LandingHero } from "../components/LandingHero";
import { LandingModulesSection } from "../components/LandingModulesSection";
import { LandingTestimonialsSection } from "../components/LandingTestimonialsSection";
import { useLandingContent } from "../hooks/useLandingContent";

export function LandingPage({ onNavigate }) {
  const { modules, testimonials } = useLandingContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LandingHeader onNavigate={onNavigate} />
      <LandingHero onNavigate={onNavigate} />
      <LandingModulesSection modules={modules} />
      <LandingTestimonialsSection testimonials={testimonials} />
      <LandingFooter />
    </div>
  );
}
