export const en = {
  app: {
    name: "AI Communication Assistant",
    tagline: "Communicate clearly, without barriers",
  },
  status: {
    idle: "Ready",
    listening: "Listening...",
    processing: "Processing...",
    speaking: "Speaking...",
    connected: "Connected",
    disconnected: "Reconnecting...",
  },
  controls: {
    startListening: "Start listening",
    stopListening: "Stop listening",
    sendMessage: "Send message",
    speakAloud: "Speak aloud",
    clearChat: "Clear conversation",
    placeholder: "Type a message...",
    send: "Send",
  },
  actions: {
    simplify: "Simplify",
    clarify: "Clarify",
    translate: "Translate",
    speakThis: "Speak this",
    copy: "Copy",
    simplifyHint: "Rewrite in simpler language",
    clarifyHint: "Add helpful explanation",
    translateHint: "Translate to other language",
  },
  captions: {
    title: "Live Captions",
    empty: "Live captions will appear here when someone speaks.",
    listening: "Listening for speech...",
  },
  chat: {
    emptyTitle: "Start a conversation",
    emptySubtitle: "Use the microphone to capture speech, or type a message below.",
    you: "You",
    assistant: "Assistant",
    transcript: "Transcript",
  },
  accessibility: {
    title: "Accessibility",
    highContrast: "High contrast",
    fontSize: "Font size",
    fontSizeNormal: "Normal",
    fontSizeLarge: "Large",
    fontSizeXLarge: "Extra Large",
  },
  language: {
    english: "English",
    arabic: "Arabic (العربية)",
    toggle: "Switch language",
  },
  errors: {
    connectionFailed: "Could not connect to server. Retrying...",
    micPermission: "Microphone access is required. Please allow access in your browser settings.",
    transcriptionFailed: "Could not transcribe audio. Please try again.",
    aiFailed: "AI response failed. Please try again.",
    ttsFailed: "Could not generate speech. Please try again.",
  },
  mode: {
    title: "Mode",
    deafMode: "I am Deaf",
    muteMode: "I am Mute",
    deafDesc: "Speech is converted to text for you",
    muteDesc: "Your text is converted to speech",
  },
};

export type Translations = typeof en;
