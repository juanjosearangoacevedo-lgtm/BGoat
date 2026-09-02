import { landingModules, landingTestimonials } from "../services/landingContent";

export function useLandingContent() {
  return {
    modules: landingModules,
    testimonials: landingTestimonials,
  };
}
