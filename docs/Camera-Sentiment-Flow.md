# HearMeAI — Camera Sentiment Flow (Documentation)

**Project:** AI Communication Solutions for Deaf & Mute Individuals  
**Branch:** `fullstack-monorepo-apr20`  
**Purpose:** Explain how the optional webcam mood detection works and what technologies we use.  
**Audience:** Team members / demo reviewers

---

## 1. Summary (one paragraph)

The app can read **facial expression** from the user’s webcam to guess mood (happy, sad, angry, anxious, neutral). The browser captures a **still image every 2 seconds** (not live video streaming). Each image is sent to the backend as **JPEG + base64**. The server runs a **Hugging Face ViT model** trained on facial expressions, returns a label and confidence, and the UI shows an emoji when confidence is high enough. When the user **sends a message** or **finishes speaking**, that camera mood is combined with **text sentiment** (OpenRouter LLM) and optional **manual mood emoji** (picker above the message box). The result affects **AI replies** and what the **other person** sees in the chat.

---

## 2. What we used (technology stack)

| Layer | Technology | Purpose |
|--------|------------|---------|
| **Browser camera** | `navigator.mediaDevices.getUserMedia` | Access front webcam (video only, no mic) |
| **Frame capture** | HTML `<canvas>` + JPEG export | Resize frame (max ~480px), compress (~72% quality) |
| **Frontend → API** | `POST /api/v1/sessions/{sessionId}/camera-sentiment` | Send one image per request (authenticated JWT) |
| **Main ML model** | **`trpakov/vit-face-expression`** (ViT, Hugging Face) | 7 FER-style classes: angry, disgust, fear, happy, sad, surprise, neutral |
| **ML runtime** | `torch` + `transformers` (`image-classification` pipeline) | Run model on server |
| **Face crop** | **OpenCV** Haar cascade (`haarcascade_frontalface_default`) | Crop largest face before classification |
| **Image decode** | **Pillow (PIL)** | Open JPEG from bytes |
| **Fallback** | Heuristic rules (Pillow brightness) | If model fails or `CAMERA_SENTIMENT_PROVIDER=heuristic` |
| **Text sentiment** | **OpenRouter** — `CLASSIFIER_MODEL` (e.g. `gpt-4o-mini`) | Classify message text separately from camera |
| **Emotion-aware replies** | **OpenRouter** — `OPENROUTER_MODEL` + `emotion_aware_prompt.py` | AI answers that acknowledge detected mood |
| **Real-time chat** | **WebSocket** `/api/v1/ws/session/{sessionId}` | Attach camera mood when sending text/audio |
| **State (UI)** | **Zustand** `sessionStore.cameraSentiment` | Latest camera label + confidence in the session |

### Python packages (backend `requirements.txt`)

- `torch`, `transformers` — ViT model  
- `opencv-python-headless` — face detection  
- `Pillow` — image handling  

### Environment variables (`backend/.env`)

| Variable | Example | Meaning |
|----------|---------|---------|
| `CAMERA_SENTIMENT_PROVIDER` | `huggingface` | Use ViT model (`heuristic` = rules only) |
| `CAMERA_SENTIMENT_MODEL` | `trpakov/vit-face-expression` | Hugging Face model id |
| `CAMERA_SENTIMENT_DEVICE` | `cpu` | `cpu`, `cuda`, or `mps` |
| `CAMERA_SENTIMENT_FALLBACK_HEURISTIC` | `true` | Use simple rules if model errors |
| `OPENROUTER_API_KEY` | (secret) | Required for text classification + AI replies |

**Note:** First run on a new machine downloads ~350MB model weights. First analysis can take 30–90 seconds on CPU.

---

## 3. Model labels → app labels

The ViT outputs FER2013-style classes. We map them to app mood labels:

| Model output | App label | Typical emoji (UI) |
|--------------|-----------|---------------------|
| happy, surprise | **positive** | 😊 |
| neutral | **neutral** | 😐 |
| angry | **angry** | 😠 |
| sad | **sad** | 😢 |
| fear, disgust | **anxious** | 😟 |

---

## 4. Step-by-step flow

### Phase A — User turns camera ON (panel only)

1. User opens a **chat session** and clicks to enable camera in the **Camera sentiment** panel (right side on desktop).
2. Browser asks for **camera permission**.
3. Video preview plays locally; **no video** is streamed to the server.
4. **Every 2 seconds:**
   - Grab one frame from the video.
   - Draw it on a canvas (scaled down).
   - Convert to **JPEG base64** string.
   - Call REST API: `POST /api/v1/sessions/{sessionId}/camera-sentiment`.
5. Backend decodes image → crops face (OpenCV) → runs ViT → returns `{ label, confidence, method }`.
6. Frontend saves result in **`cameraSentiment`** and shows emoji + percentage if confidence ≥ **62%**.

### Phase B — User sends a message (camera + text + AI)

1. User types and sends, or finishes **microphone** recording.
2. Frontend reads latest `cameraSentiment` (only if confidence ≥ **62%**).
3. Optional: user picked a **manual mood emoji** (😐 😊 😠 😢 😟) — this **overrides** camera.
4. WebSocket sends `user_text` or `audio_end` with:
   - message text (or audio for STT),
   - `cameraLabel` / `cameraConfidence` (if any),
   - `moodLabel` (if manual picker used).
5. Backend:
   - Runs **text classifier** (OpenRouter) on the message.
   - **Fuses** manual mood > camera > text (`fuse_sentiments`, `resolve_user_emotion`).
   - Saves message; broadcasts **sentiment** to peers.
   - Generates **emotion-aware AI reply** when appropriate.
6. Peer sees mood on the message; AI reply references mood (e.g. cheerful / frustrated).

### Phase C — User turns camera OFF

1. Browser stops webcam tracks and clears interval.
2. `cameraSentiment` is cleared in the store.

---

## 5. Flow diagram (simple)

```
[Webcam] → every 2s → [Canvas JPEG] → REST API → [ViT + OpenCV] → [label + confidence]
                                                              ↓
                                                    [UI: Camera panel emoji]
                                                              ↓
[User sends text/audio] → WebSocket → [fuse: manual mood | camera | text] → [AI reply + peer UI]
```

---

## 6. Where it appears in the UI

| Location | Who sees it |
|----------|-------------|
| **Camera sentiment panel** | All profiles (deaf, mute, both, normal) — desktop right rail |
| **Sign hologram** | Deaf / both only (above or beside camera panel) |
| **Mood emoji picker** | Above message input (`ControlDock`) — manual override |
| **Chat bubbles** | Sentiment emoji on messages (when confident) |
| **Emotion tune hint** | Banner when AI reply was tuned to mood |

---

## 7. Important rules (for testing)

1. **Camera is optional** — app works without it.  
2. **Manual mood beats camera** — if user selects 😠 before send, camera is ignored for that message.  
3. **Low confidence** — below 62%, camera mood is not sent with messages (panel may still show internal result).  
4. **Not continuous video** — only still images every 2 seconds while camera is on.  
5. **Privacy** — frames go to your backend only during analysis; they are not stored as video files in this flow.  
6. **Separate from mic** — camera does not record audio; microphone uses STT pipeline (Whisper / gpt-audio-mini).

---

## 8. Main code files (for developers)

| File | Role |
|------|------|
| `frontend/src/components/chat/CameraSentimentPanel.tsx` | Webcam UI + 2s capture loop |
| `frontend/src/lib/api/client.ts` | `postCameraSentiment()` |
| `frontend/src/lib/hooks/useSession.ts` | Attach camera to WebSocket on send |
| `backend/app/api/v1/endpoints/sessions.py` | REST endpoint |
| `backend/app/services/facial_sentiment_service.py` | Provider + fusion helpers |
| `backend/app/services/facial_emotion_hf.py` | Hugging Face ViT + face crop |
| `backend/app/services/emotion_aware_prompt.py` | Mood-aware AI prompts |
| `backend/app/api/v1/endpoints/ws_session.py` | WebSocket + emotion fusion on send |

---