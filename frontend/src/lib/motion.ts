/**
 * HearMeAI motion system — durations, easings, and Framer Motion variants (ULTRA Phase 0B).
 */

import type { Variants } from "framer-motion";

/** Durations in milliseconds for UI and Framer `transition.duration` (seconds). */
export const motionMs = {
  fast: 120,
  normal: 220,
  slow: 380,
  xslow: 600,
} as const;

/** Cubic-bezier tuples for Framer Motion and CSS. */
export const motionEase = {
  spring: [0.34, 1.56, 0.64, 1],
  smooth: [0.4, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
} as const;

/** Reusable Framer Motion variant sets. */
export const motionVariants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: motionEase.out },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.22 },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.28, ease: motionEase.spring },
    },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: motionEase.out },
    },
  },
  stagger: {
    visible: {
      transition: { staggerChildren: 0.07 },
    },
  },
};

/** Flat export matching ULTRA plan naming. */
export const motion = {
  fast: motionMs.fast,
  normal: motionMs.normal,
  slow: motionMs.slow,
  xslow: motionMs.xslow,
  spring: motionEase.spring,
  smooth: motionEase.smooth,
  out: motionEase.out,
  in: motionEase.in,
  fadeUp: motionVariants.fadeUp,
  fadeIn: motionVariants.fadeIn,
  scaleIn: motionVariants.scaleIn,
  slideRight: motionVariants.slideRight,
  stagger: motionVariants.stagger,
} as const;
