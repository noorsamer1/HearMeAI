import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import AnimatedPreview from "@/components/landing/AnimatedPreview";
import FeaturesBento from "@/components/landing/FeaturesBento";
import AccessibilitySection from "@/components/landing/AccessibilitySection";
import ImpactSection from "@/components/landing/ImpactSection";
import AcademicSection from "@/components/landing/AcademicSection";

export default function Home() {
  return (
    <main
      id="top"
      className="mesh-bg surface-page relative selection:bg-[color-mix(in_srgb,var(--color-brand)_20%,transparent)]"
    >
      <Navbar />
      <div className="relative z-10">
        <HeroSection />
        <ProblemSection />
        <AnimatedPreview />
        <FeaturesBento />
        <AccessibilitySection />
        <ImpactSection />
        <AcademicSection />
      </div>
    </main>
  );
}
