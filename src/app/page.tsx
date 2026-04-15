import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AnimatedPreview from "@/components/landing/AnimatedPreview";
import LandingSections from "@/components/landing/LandingSections";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 relative selection:bg-brand-500/30">
      <Navbar />
      <div className="relative z-10">
        <HeroSection />
        <AnimatedPreview />
        <LandingSections />
      </div>

      <footer className="py-8 border-t border-white/5 mt-20 text-center text-slate-500">
        <p className="text-sm font-sans">
          &copy; {new Date().getFullYear()} HearME AI. All rights reserved. Built with ❤️ for Accessibility.
        </p>
      </footer>
    </main>
  );
}
