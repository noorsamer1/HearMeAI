"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-neon-blue/20 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <div className="container px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 mb-8"
          >
            <Sparkles className="w-4 h-4 text-neon-yellow" />
            <span className="text-sm font-medium text-slate-300">The future of inclusive communication</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-heading mb-6 leading-tight tracking-tight"
          >
            Connect Effortlessly.{" "}
            <span className="text-gradient">In Real Time.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed"
          >
            An AI-powered platform designed to empower Deaf and non-verbal individuals. Turn speech into text, and text into natural voices, instantly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
          >
            <a href="/app" className="w-full sm:w-auto">
              <button className="w-full relative group overflow-hidden rounded-full bg-slate-50 px-8 py-4 font-semibold text-slate-900 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95">
                <span className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
                  Start Communicating <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </a>
            
            <a href="#about" className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 rounded-full font-medium text-white glass hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
