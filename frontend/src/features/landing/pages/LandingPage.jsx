import { LandingHeader } from "../components/LandingHeader";
import { LandingHero } from "../components/LandingHero";

export function LandingPage({ onNavigate }) {
  return (
    <div className="fuente-bgoat min-h-screen bg-white">
      <LandingHeader onNavigate={onNavigate} />
      <LandingHero />
    </div>
  );
}
