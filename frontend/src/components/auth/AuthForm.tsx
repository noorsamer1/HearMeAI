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
      className="relative w-full overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-lg)] md:p-10"
    >
      {/* Decorative Blur Background inside card */}
      <div className="pointer-events-none absolute left-0 top-0 h-1/2 w-full bg-gradient-to-b from-[var(--color-brand-muted)] to-transparent" />

      <div className="relative z-10">
        <h2 className="mb-2 text-3xl font-heading font-bold text-[var(--color-text-primary)]">
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p className="mb-8 font-sans text-[var(--color-text-secondary)]">
          {isLogin ? "Enter your details to access your dashboard." : "Sign up to start communicating freely."}
        </p>

        {/* User Mode Toggle */}
        <div className="relative mb-8 flex rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-1.5">
          <motion.div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-sm"
            animate={{ left: userMode === "deaf" ? "6px" : "calc(50%)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <button
            type="button"
            onClick={() => setUserMode("deaf")}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors ${
              userMode === "deaf"
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <EarOff className="w-4 h-4" /> Deaf User
          </button>
          
          <button
            type="button"
            onClick={() => setUserMode("mute")}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors ${
              userMode === "mute"
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
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
                    <User className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="input-field rounded-xl py-3.5 pl-12 pr-4 font-sans"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <input
              type="email"
              placeholder="Email address"
              className="input-field rounded-xl px-4 py-3.5 font-sans"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="input-field rounded-xl px-4 py-3.5 font-sans"
            />
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-500)] py-4 font-semibold text-[var(--color-text-inverse)] transition-opacity hover:opacity-95 active:scale-[0.98]"
        >
          {isLogin ? "Sign In" : "Create Account"}
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-8 text-center">
          <p className="font-sans text-sm text-[var(--color-text-secondary)]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-[var(--color-brand)] transition-colors hover:text-[var(--color-brand-dim)]"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
