"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VolumeX, EarOff, ArrowRight, User } from "lucide-react";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [userMode, setUserMode] = useState<"deaf" | "mute">("deaf");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[2rem] p-8 md:p-10 w-full relative overflow-hidden"
    >
      {/* Decorative Blur Background inside card */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-600/10 to-transparent pointer-events-none" />

      <div className="relative z-10">
        <h2 className="text-3xl font-heading font-bold mb-2">
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-slate-400 font-sans mb-8">
          {isLogin ? "Enter your details to access your dashboard." : "Sign up to start communicating freely."}
        </p>

        {/* User Mode Toggle */}
        <div className="bg-slate-900/50 p-1.5 rounded-2xl flex relative mb-8 border border-white/5">
          <motion.div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-brand-600 rounded-xl shadow-lg border border-white/10"
            animate={{ left: userMode === "deaf" ? "6px" : "calc(50%)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <button
            onClick={() => setUserMode("deaf")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm relative z-10 transition-colors ${
              userMode === "deaf" ? "text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <EarOff className="w-4 h-4" /> Deaf User
          </button>
          
          <button
            onClick={() => setUserMode("mute")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm relative z-10 transition-colors ${
              userMode === "mute" ? "text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <VolumeX className="w-4 h-4" /> Mute User
          </button>
        </div>

        {/* Dynamic Form */}
        <div className="space-y-4 mb-8">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans"
            />
          </div>
        </div>

        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-accent text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
          {isLogin ? "Sign In" : "Create Account"}
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-sans">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand-400 font-medium hover:text-brand-300 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
