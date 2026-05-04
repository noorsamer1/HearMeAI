import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type MessageRole = "user" | "assistant" | "transcript" | "action-result";
export type SystemStatus = "idle" | "listening" | "processing" | "speaking";
export type Language = "en" | "ar";
export type FontSize = "normal" | "large" | "xlarge";
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
  fontSize: FontSize;
  inputText: string;
  activeAudioId: string | null;
  signPreview: { phraseKey: string; assetUrl?: string; motionPlan?: SignMotionStep[] } | null;

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
  setFontSize: (size: FontSize) => void;
  setInputText: (text: string) => void;
  setActiveAudioId: (id: string | null) => void;
  setSignPreview: (
    value: { phraseKey: string; assetUrl?: string; motionPlan?: SignMotionStep[] } | null
  ) => void;
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
      fontSize: "normal",
      inputText: "",
      activeAudioId: null,
      signPreview: null,

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
      setFontSize: (size) => set({ fontSize: size }),
      setInputText: (text) => set({ inputText: text }),
      setActiveAudioId: (id) => set({ activeAudioId: id }),
      setSignPreview: (value) => set({ signPreview: value }),
      clearMessages: () => set({ messages: [], liveCaption: "", liveAiResponse: "", signPreview: null }),
      setMessages: (messages) =>
        set({ messages, liveCaption: "", liveAiResponse: "", signPreview: null }),
    }),
    { name: "session-store" }
  )
);
