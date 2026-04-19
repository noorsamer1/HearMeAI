const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WSEvent {
  type: string;
  [key: string]: unknown;
}

type EventHandler = (event: WSEvent) => void;

export class SessionWebSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private wsToken: string | null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1500;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private statusCallback?: (status: WSStatus) => void;
  private isManuallyClosed = false;

  constructor(sessionId: string, wsToken?: string | null) {
    this.sessionId = sessionId;
    this.wsToken = wsToken ?? null;
  }

  connect(onStatus?: (status: WSStatus) => void): void {
    this.statusCallback = onStatus;
    this.isManuallyClosed = false;
    this._connect();
  }

  private _connect(): void {
    const q = this.wsToken ? `?token=${encodeURIComponent(this.wsToken)}` : "";
    const url = `${WS_URL}/api/v1/ws/session/${this.sessionId}${q}`;
    this.statusCallback?.("connecting");

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.statusCallback?.("connected");
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data);
          this._dispatch(data.type, data);
          this._dispatch("*", data);
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onerror = () => {
        this.statusCallback?.("error");
      };

      this.ws.onclose = () => {
        this._stopPing();
        if (!this.isManuallyClosed) {
          this.statusCallback?.("disconnected");
          this._scheduleReconnect();
        }
      };
    } catch {
      this.statusCallback?.("error");
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isManuallyClosed) return;

    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      if (!this.isManuallyClosed) this._connect();
    }, delay);
  }

  private _startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 25_000);
  }

  private _stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const list = this.handlers.get(eventType);
    if (list) {
      this.handlers.set(
        eventType,
        list.filter((h) => h !== handler)
      );
    }
  }

  private _dispatch(eventType: string, event: WSEvent): void {
    this.handlers.get(eventType)?.forEach((h) => h(event));
  }

  send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendAudioChunk(base64: string, mimeType = "audio/webm"): void {
    this.send({ type: "audio_chunk", data: base64, mimeType });
  }

  sendAudioEnd(lang?: string): void {
    this.send({ type: "audio_end", lang: lang || "auto" });
  }

  sendText(text: string, requestTTS = false, lang = "en"): void {
    this.send({ type: "user_text", text, requestTTS, lang });
  }

  sendAction(
    action: "simplify" | "clarify" | "translate",
    text: string,
    messageId: string,
    targetLang?: string
  ): void {
    this.send({ type: "action", action, text, messageId, targetLang });
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.isManuallyClosed = true;
    this._stopPing();
    this.ws?.close();
    this.ws = null;
  }
}
