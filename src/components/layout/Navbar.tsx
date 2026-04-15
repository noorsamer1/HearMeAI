"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mic, Activity } from "lucide-react";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Mic className="w-5 h-5 text-white" />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-xl bg-white/20 blur-md pointer-events-none"
            />
          </div>
          <span className="text-xl font-bold font-heading text-white tracking-tight">
            HearME <span className="text-brand-400">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Technology", "Accessibility", "About"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/auth"
            className="hidden md:block text-sm font-medium text-slate-300 hover:text-white px-4 py-2"
          >
            Sign In
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/app"
            className="relative group overflow-hidden rounded-full bg-white px-6 py-2.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative text-sm font-semibold text-slate-900 group-hover:text-white transition-colors duration-300">
              Start Demo
            </span>
          </motion.a>
        </div>
      </div>
    </motion.nav>
  );
}
