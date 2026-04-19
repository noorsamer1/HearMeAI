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
      className="min-h-screen bg-slate-950 text-slate-50 relative selection:bg-brand-500/30"
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
