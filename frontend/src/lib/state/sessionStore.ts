import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { SpellStep } from "@/lib/sign/spellingPlan";
import type { ManualMoodId } from "@/lib/sentiment/sentimentDisplay";

export type MessageRole = "user" | "assistant" | "transcript" | "action-result";
export type SystemStatus = "idle" | "listening" | "processing" | "speaking";
export type Language = "en" | "ar";
export type FontSize = "normal" | "large" | "xlarge";
export type ColorMode = "light" | "dark";
/** The communication profile of the currently signed-in user. */
export type UserType = "deaf" | "mute" | "both" | "normal";
export type SignPose =
  | "neutral"
  | "wave"
  | "thank-you"
  | "yes"
  | "no"
  | "please"
  | "help"
  | "question";

export interface SignMotionStep {
  pose: SignPose;
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  isPartial?: boolean;
  confidence?: number;
  detectedLang?: string;
  audioBase64?: string;
  action?: string;
  sourceMessageId?: string;
  /** Message relayed from another participant in the room */
  fromPeer?: boolean;
  /** Display name of the peer who sent this message */
  senderName?: string;
  sentimentLabel?: string;
  sentimentScore?: number;
  /** How mood was inferred: expression | text | expression_and_text */
  sentimentSource?: string;
}

interface SessionState {
  sessionId: string;
  messages: ChatMessage[];
  liveCaption: string;
  liveAiResponse: string;
  systemStatus: SystemStatus;
  isConnected: boolean;
  language: Language;
  isHighContrast: boolean;
  /** UI chrome: light (default) or dark Aurora palette */
  colorMode: ColorMode;
  fontSize: FontSize;
  inputText: string;
  activeAudioId: string | null;
  signPreview: {
    phraseKey: string;
    /** Full text used for finger-spelling (rebuild when spacing toggle changes). */
    spellSourceText?: string;
    assetUrl?: string;
    motionPlan?: SignMotionStep[];
    /** Finger-spelling + word markers for 2D (takes precedence over motionPlan). */
    spellPlan?: SpellStep[];
  } | null;
  /** When true, inserts a short "·" pause between finger-spelled letters. */
  signShowSpacesBetweenLetters: boolean;
  /** Incremented to restart the current 2D sign sequence from the beginning. */
  signReplayNonce: number;
  /** Communication profile of the signed-in user. null until resolved from the server. */
  userType: UserType | null;
  /** Set when a peer disconnects — cleared after the user dismisses the notice. */
  peerLeftAlert: string | null;
  /** Set when a peer (re)joins and wants to chat — cleared after user acts. */
  peerJoinAlert: { name: string; sessionId: string } | null;
  /** Latest camera-based sentiment (optional). */
  cameraSentiment: { label: string; confidence: number; method?: string } | null;
  /** Shown when the assistant reply was tuned using fused text + camera mood. */
  replyEmotionHint: { label: string; confidence: number; messageId?: string } | null;
  /** Mood emoji selected before the next send (neutral, angry, happy, etc.). */
  manualMood: ManualMoodId | null;

  // Actions
  setSessionId: (id: string) => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setLiveCaption: (text: string) => void;
  setLiveAiResponse: (text: string) => void;
  clearLiveResponse: () => void;
  setSystemStatus: (status: SystemStatus) => void;
  setIsConnected: (connected: boolean) => void;
  setLanguage: (lang: Language) => void;
  setIsHighContrast: (value: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
  setFontSize: (size: FontSize) => void;
  setInputText: (text: string) => void;
  setActiveAudioId: (id: string | null) => void;
  setSignPreview: (
    value: {
      phraseKey: string;
      spellSourceText?: string;
      assetUrl?: string;
      motionPlan?: SignMotionStep[];
      spellPlan?: SpellStep[];
    } | null
  ) => void;
  setSignShowSpacesBetweenLetters: (value: boolean) => void;
  bumpSignReplay: () => void;
  setUserType: (type: UserType) => void;
  setPeerLeftAlert: (name: string | null) => void;
  setPeerJoinAlert: (value: { name: string; sessionId: string } | null) => void;
  setCameraSentiment: (
    value: { label: string; confidence: number; method?: string } | null
  ) => void;
  setReplyEmotionHint: (
    value: { label: string; confidence: number; messageId?: string } | null
  ) => void;
  setManualMood: (mood: ManualMoodId | null) => void;
  clearMessages: () => void;
  /** Replace timeline (e.g. after loading history from the API). */
  setMessages: (messages: ChatMessage[]) => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      sessionId: uuidv4(),
      messages: [],
      liveCaption: "",
      liveAiResponse: "",
      systemStatus: "idle",
      isConnected: false,
      language: "en",
      isHighContrast: false,
      colorMode: "light",
      fontSize: "normal",
      inputText: "",
      activeAudioId: null,
      signPreview: null,
      signShowSpacesBetweenLetters: false,
      signReplayNonce: 0,
      userType: null,
      peerLeftAlert: null,
      peerJoinAlert: null,
      cameraSentiment: null,
      replyEmotionHint: null,
      manualMood: null,

      setSessionId: (id) => set({ sessionId: id }),

      addMessage: (msg) => {
        const id = uuidv4();
        const message: ChatMessage = {
          id,
          timestamp: Date.now(),
          ...msg,
        };
        set((state) => ({ messages: [...state.messages, message] }));
        return id;
      },

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      setLiveCaption: (text) => set({ liveCaption: text }),
      setLiveAiResponse: (text) => set({ liveAiResponse: text }),
      clearLiveResponse: () => set({ liveAiResponse: "" }),
      setSystemStatus: (status) => set({ systemStatus: status }),
      setIsConnected: (connected) => set({ isConnected: connected }),
      setLanguage: (lang) => set({ language: lang }),
      setIsHighContrast: (value) => set({ isHighContrast: value }),
      setColorMode: (colorMode) => set({ colorMode }),
      setFontSize: (size) => set({ fontSize: size }),
      setInputText: (text) => set({ inputText: text }),
      setActiveAudioId: (id) => set({ activeAudioId: id }),
      setSignPreview: (value) => set({ signPreview: value }),
      setSignShowSpacesBetweenLetters: (signShowSpacesBetweenLetters) =>
        set({ signShowSpacesBetweenLetters }),
      bumpSignReplay: () => set((s) => ({ signReplayNonce: s.signReplayNonce + 1 })),
      setUserType: (type) => set({ userType: type }),
      setPeerLeftAlert: (name) => set({ peerLeftAlert: name }),
      setPeerJoinAlert: (value) => set({ peerJoinAlert: value }),
      setCameraSentiment: (value) => set({ cameraSentiment: value }),
      setReplyEmotionHint: (value) => set({ replyEmotionHint: value }),
      setManualMood: (manualMood) => set({ manualMood }),
      clearMessages: () =>
        set({
          messages: [],
          liveCaption: "",
          liveAiResponse: "",
          signPreview: null,
          replyEmotionHint: null,
          manualMood: null,
        }),
      setMessages: (messages) =>
        set({
          messages,
          liveCaption: "",
          liveAiResponse: "",
          signPreview: null,
          replyEmotionHint: null,
        }),
    }),
    { name: "session-store" }
  )
);
