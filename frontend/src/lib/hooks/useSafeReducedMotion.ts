"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * SSR-safe wrapper for framer-motion's useReducedMotion.
 *
 * The native hook returns `null` during SSR and the real value on the client,
 * which causes hydration mismatches when components render different markup
 * for reduced-motion users. This wrapper always returns `false` on the first
 * render (matching what the server emits) and switches to the real preference
 * after mount.
 */
export function useSafeReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? !!reduce : false;
}
