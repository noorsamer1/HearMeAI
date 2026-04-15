import type { Translations } from "./en";

export const ar: Translations = {
  app: {
    name: "مساعد التواصل الذكي",
    tagline: "تواصل بوضوح، بلا حواجز",
  },
  status: {
    idle: "جاهز",
    listening: "يستمع...",
    processing: "يعالج...",
    speaking: "يتحدث...",
    connected: "متصل",
    disconnected: "إعادة الاتصال...",
  },
  controls: {
    startListening: "بدء الاستماع",
    stopListening: "إيقاف الاستماع",
    sendMessage: "إرسال الرسالة",
    speakAloud: "نطق بصوت عالٍ",
    clearChat: "مسح المحادثة",
    placeholder: "اكتب رسالة...",
    send: "إرسال",
  },
  actions: {
    simplify: "تبسيط",
    clarify: "توضيح",
    translate: "ترجمة",
    speakThis: "نطق هذا",
    copy: "نسخ",
    simplifyHint: "إعادة الصياغة بلغة أبسط",
    clarifyHint: "إضافة شرح مفيد",
    translateHint: "ترجمة إلى لغة أخرى",
  },
  captions: {
    title: "التعليقات المباشرة",
    empty: "ستظهر التعليقات المباشرة هنا عندما يتحدث شخص ما.",
    listening: "الاستماع للكلام...",
  },
  chat: {
    emptyTitle: "ابدأ محادثة",
    emptySubtitle: "استخدم الميكروفون لالتقاط الكلام، أو اكتب رسالة أدناه.",
    you: "أنت",
    assistant: "المساعد",
    transcript: "النص المحول",
  },
  accessibility: {
    title: "إمكانية الوصول",
    highContrast: "تباين عالٍ",
    fontSize: "حجم الخط",
    fontSizeNormal: "عادي",
    fontSizeLarge: "كبير",
    fontSizeXLarge: "كبير جداً",
  },
  language: {
    english: "English (الإنجليزية)",
    arabic: "العربية",
    toggle: "تغيير اللغة",
  },
  errors: {
    connectionFailed: "تعذر الاتصال بالخادم. إعادة المحاولة...",
    micPermission: "مطلوب الوصول إلى الميكروفون. يرجى السماح بالوصول في إعدادات المتصفح.",
    transcriptionFailed: "تعذر تحويل الصوت إلى نص. يرجى المحاولة مرة أخرى.",
    aiFailed: "فشل الرد الذكي. يرجى المحاولة مرة أخرى.",
    ttsFailed: "تعذر توليد الكلام. يرجى المحاولة مرة أخرى.",
  },
  mode: {
    title: "الوضع",
    deafMode: "أنا أصم",
    muteMode: "أنا أبكم",
    deafDesc: "يتم تحويل الكلام إلى نص بالنسبة لك",
    muteDesc: "يتم تحويل نصك إلى كلام",
  },
};
