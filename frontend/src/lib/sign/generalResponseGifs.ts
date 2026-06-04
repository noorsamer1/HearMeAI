/** IDs for the 9 general-response avatar GIFs in `/public/gifs/`. */
export type GeneralResponseGifId =
  | "idle"
  | "thinking"
  | "happy"
  | "empathetic"
  | "question"
  | "help"
  | "encourage"
  | "confused"
  | "goodbye";

export interface GeneralResponseGifMeta {
  id: GeneralResponseGifId;
  /** File name under `frontend/public/gifs/` */
  fileName: string;
  labelEn: string;
  labelAr: string;
  fallbackEmoji: string;
}

export const GENERAL_RESPONSE_GIFS: GeneralResponseGifMeta[] = [
  // idle: also used for neutral / default general replies (no neutral.gif)
  {
    id: "idle",
    fileName: "idle.gif",
    labelEn: "Listening",
    labelAr: "يستمع",
    fallbackEmoji: "👂",
  },
  {
    id: "thinking",
    fileName: "thinking.gif",
    labelEn: "Thinking",
    labelAr: "يفكر",
    fallbackEmoji: "🤔",
  },
  {
    id: "happy",
    fileName: "happy.gif",
    labelEn: "Happy",
    labelAr: "سعيد",
    fallbackEmoji: "😊",
  },
  {
    id: "empathetic",
    fileName: "empathetic.gif",
    labelEn: "Supportive",
    labelAr: "داعم",
    fallbackEmoji: "🤗",
  },
  {
    id: "question",
    fileName: "question.gif",
    labelEn: "Question",
    labelAr: "سؤال",
    fallbackEmoji: "❓",
  },
  {
    id: "help",
    fileName: "help.gif",
    labelEn: "Help",
    labelAr: "مساعدة",
    fallbackEmoji: "🆘",
  },
  {
    id: "encourage",
    fileName: "encourage.gif",
    labelEn: "Encouraging",
    labelAr: "مشجّع",
    fallbackEmoji: "👏",
  },
  {
    id: "confused",
    fileName: "confused.gif",
    labelEn: "Uncertain",
    labelAr: "غير متأكد",
    fallbackEmoji: "😕",
  },
  {
    id: "goodbye",
    fileName: "goodbye.gif",
    labelEn: "Goodbye",
    labelAr: "وداعاً",
    fallbackEmoji: "👋",
  },
];

const GIF_BY_ID = Object.fromEntries(
  GENERAL_RESPONSE_GIFS.map((g) => [g.id, g])
) as Record<GeneralResponseGifId, GeneralResponseGifMeta>;

export function getGeneralResponseGifMeta(
  id: GeneralResponseGifId
): GeneralResponseGifMeta {
  return GIF_BY_ID[id];
}

export function generalResponseGifSrc(id: GeneralResponseGifId): string {
  return `/gifs/${GIF_BY_ID[id].fileName}`;
}
