"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";

interface WaveformAnimationProps {
  isActive: boolean;
  volumeLevel?: number;
  barCount?: number;
  className?: string;
  color?: string;
}

export function WaveformAnimation({
  isActive,
  volumeLevel = 0,
  barCount = 9,
  className,
  color = "#60a5fa",
}: WaveformAnimationProps) {
  const bars = Array.from({ length: barCount });

  return (
    <div
      className={clsx("flex items-center justify-center gap-[3px]", className)}
      aria-hidden
    >
      {bars.map((_, i) => {
        const baseHeight = 4;
        const maxHeight = 28;
        const phase = (i / barCount) * Math.PI * 2;
        const naturalHeight =
          baseHeight + (maxHeight - baseHeight) * Math.abs(Math.sin(phase + Date.now() / 300));

        const activeHeight = isActive
          ? baseHeight + (maxHeight - baseHeight) * (volumeLevel * 0.7 + 0.3 * Math.random())
          : baseHeight;

        return (
          <motion.div
            key={i}
            animate={{
              scaleY: isActive ? [0.3, 1, 0.3] : 0.3,
              opacity: isActive ? 1 : 0.35,
            }}
            transition={{
              duration: 0.6 + Math.random() * 0.4,
              repeat: isActive ? Infinity : 0,
              delay: i * 0.07,
              ease: "easeInOut",
            }}
            className="rounded-full origin-center"
            style={{
              width: 3,
              height: maxHeight,
              backgroundColor: color,
              transformOrigin: "center",
            }}
          />
        );
      })}
    </div>
  );
}
