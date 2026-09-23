import { LandingFooter } from "../components/LandingFooter";
import { LandingHeader } from "../components/LandingHeader";
import { LandingHero } from "../components/LandingHero";
import { LandingModulesSection } from "../components/LandingModulesSection";
import { LandingTableroSection } from "../components/LandingTableroSection";
import { LandingTestimonialsSection } from "../components/LandingTestimonialsSection";
import { LandingTrustBar } from "../components/LandingTrustBar";
import { useLandingContent } from "../hooks/useLandingContent";

export function LandingPage({ onNavigate }) {
  const { modules, testimonials } = useLandingContent();

  return (
    <div className="fuente-bgoat min-h-screen bg-white">
      <LandingHeader onNavigate={onNavigate} />
      <LandingHero />
      <LandingTrustBar />
      <LandingTableroSection />
      <LandingModulesSection modules={modules} />
      <LandingTestimonialsSection testimonials={testimonials} />
      <LandingFooter />
    </div>
  );
}
