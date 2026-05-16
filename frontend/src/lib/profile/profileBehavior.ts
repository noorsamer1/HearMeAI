import type { UserType } from "@/lib/state/sessionStore";

export const PROFILE_LABELS: Record<UserType, string> = {
  deaf: "Deaf",
  mute: "Mute",
  both: "Deaf & Mute",
  normal: "Normal",
};

export const PROFILE_DESCRIPTIONS: Record<UserType, string> = {
  deaf: "Live captions, sign keyboard, finger-spelling hologram, optional camera sentiment.",
  mute: "Type to chat, hear peers via TTS, camera sentiment in the visual panel (no sign hologram).",
  both: "Sign keyboard + hologram + captions; no mic/TTS playback for you.",
  normal: "Speak via mic, full STT/TTS; camera sentiment replaces the sign hologram.",
};

/** @deprecated Use PROFILE_LABELS — legacy listener/speaker labels removed. */
export function profileDisplayLabel(userType: UserType | string | null): string {
  if (!userType) return "";
  return PROFILE_LABELS[userType as UserType] ?? String(userType);
}
