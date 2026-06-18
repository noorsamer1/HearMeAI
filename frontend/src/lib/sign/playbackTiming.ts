/** Slower 2D finger-spelling / pose steps in the session hologram dock. */
export const HOLOGRAM_2D_DURATION_SCALE = 2.3;

export const HOLOGRAM_2D_MIN_STEP_MS = 450;
export const HOLOGRAM_2D_MAX_STEP_MS = 4200;

export function scaleHologramStepDuration(durationMs: number): number {
  return Math.round(
    Math.max(
      HOLOGRAM_2D_MIN_STEP_MS,
      Math.min(durationMs * HOLOGRAM_2D_DURATION_SCALE, HOLOGRAM_2D_MAX_STEP_MS)
    )
  );
}
