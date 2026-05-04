# HearMeAI — AI Communication Assistant for Deaf & Mute Individuals
## Complete Project Documentation (English)

**Version:** 1.0.0 | **Date:** April 2026 | **Branch:** fullstack-monorepo-apr20

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technologies Used](#3-technologies-used)
4. [Backend Documentation](#4-backend-documentation)
5. [Frontend Documentation](#5-frontend-documentation)
6. [AI / Machine Learning Model Documentation](#6-ai--machine-learning-model-documentation)
7. [Database Documentation](#7-database-documentation)
8. [Features Documentation](#8-features-documentation)
9. [User Flow](#9-user-flow)
10. [Installation and Running Guide](#10-installation-and-running-guide)
11. [Security and Validation](#11-security-and-validation)
12. [Testing and Debugging](#12-testing-and-debugging)
13. [Challenges and Solutions](#13-challenges-and-solutions)
14. [Limitations](#14-limitations)
15. [Future Work](#15-future-work)
16. [Doctor / Professor Expected Questions](#16-doctor--professor-expected-questions)
17. [Presentation Scripts](#17-presentation-scripts)
18. [File-by-File Project Explanation](#18-file-by-file-project-explanation)
19. [Final Summary](#19-final-summary)

---

## 1. PROJECT OVERVIEW

### Project Name
**HearMeAI** — AI Communication Assistant for Deaf and Mute Individuals

### Main Idea
HearMeAI is a real-time, accessibility-first web application that bridges the communication gap between deaf and mute individuals and their hearing/speaking peers. It integrates three AI-powered communication channels in a single platform: Speech-to-Text (STT), Text-to-Speech (TTS), and an intelligent language model for message enhancement.

### Problem the Project Solves
More than **430 million people** worldwide have disabling hearing loss (WHO, 2023), and millions more have conditions that prevent them from speaking. These individuals face daily communication barriers:
- Hearing people cannot easily communicate with deaf individuals in real time.
- Mute individuals cannot verbally express themselves to hearing people.
- Sign language is not universally known, limiting communication partners.
- Existing apps are often inaccessible, English-only, or lack AI assistance.

HearMeAI solves all of these by converting speech to readable text, converting text to natural speech, and providing an AI assistant that simplifies, clarifies, and translates messages.

### Target Users
| User Type | Use Case |
|---|---|
| Deaf individuals | Receive live captions of what others are saying |
| Mute individuals | Type text and have it spoken aloud for them |
| Hard-of-hearing people | Benefit from written transcripts and text enhancement |
| Families and caregivers | Communicate with deaf/mute family members |
| Healthcare workers | Communicate with deaf/mute patients |
| Teachers and educators | Inclusive classroom communication |

### Main Goal
To provide a free, accessible, AI-powered communication platform that enables real-time two-way communication between deaf/mute individuals and others, supporting both English and Arabic languages.

### Why This Project is Useful
1. **Inclusive**: Works for both deaf and mute users simultaneously
2. **Bilingual**: Full Arabic and English support with RTL layout
3. **AI-enhanced**: Messages are not just transcribed but understood and improved
4. **Accessible**: WCAG 2.1 AA/AAA compliant, high-contrast mode, font scaling
5. **Real-time**: WebSocket-based instant communication with no perceptible delay
6. **Open and deployable**: Docker support, Vercel + Railway deployment ready

### Real-World Use Case
A deaf student (Sara) is attending a university lecture. Her professor speaks, and the HearMeAI app transcribes the speech to text in real time on Sara's screen. When Sara wants to ask a question, she types her message and clicks "Speak Aloud" — the AI converts her text to a natural voice the professor hears. If a message is complex, Sara can click "Simplify" and the AI rewrites it in plain language. The system also suggests relevant sign language phrases when common phrases are detected.

### Executive Summary
HearMeAI is a production-ready, full-stack web application built with Next.js 14 (frontend) and FastAPI (backend), integrating OpenAI Whisper for speech recognition, Microsoft Edge TTS for voice synthesis, and OpenRouter (Claude 3 Haiku) for intelligent language processing. The system features real-time WebSocket communication, user authentication, session management, multi-user room matchmaking, an in-browser 3D sign language avatar, and comprehensive accessibility features. It is bilingual (English/Arabic), containerized with Docker, and ready for cloud deployment on Vercel and Railway.

---

## 2. SYSTEM ARCHITECTURE

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js 14 Frontend (React/TS)              │   │
│  │  Landing Page → Auth → Lobby → Chat Workspace            │   │
│  │                                                           │   │
│  │  [Mic Button] → MediaRecorder API → Base64 Audio         │   │
│  │  [Chat Timeline] ← WebSocket Messages                    │   │
│  │  [Audio Player] ← Base64 TTS Audio                       │   │
│  │  [3D Avatar] ← Sign Language Poses                       │   │
│  │  [Zustand Store] ← Global State                          │   │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
          ┌───────────────┴──────────────────┐
          │  REST API + WebSocket             │
          │  HTTP: /api/v1/*                  │
          │  WS: /api/v1/ws/session/{id}      │
          └───────────────┬──────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                    FastAPI Backend                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Auth   │  │ Sessions │  │   STT    │  │     TTS       │  │
│  │  /auth/* │  │/sessions │  │/speech-  │  │ /text-to-     │  │
│  │          │  │          │  │to-text   │  │  speech       │  │
│  └──────────┘  └──────────┘  └─────┬────┘  └──────┬────────┘  │
│                                     │               │            │
│  ┌──────────────────────────────────┼───────────────┼──────────┐│
│  │              AI Services         │               │          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │  STTService  │  │  TTSService  │  │  OpenRouterClient   │ ││
│  │  │  (Whisper)  │  │ (Edge TTS)  │  │  (Claude 3 Haiku)   │ ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ ││
│  └─────────┼────────────────┼─────────────────────┼────────────┘│
│            │                │                     │              │
│  ┌─────────▼────────────────▼─────────────────────▼────────────┐│
│  │                    External AI APIs                           ││
│  │  OpenRouter (Whisper STT + Claude LLM) | Edge TTS (local)   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────┐    ┌───────────────────┐                    │
│  │  SQLite / PgSQL  │    │  Redis (optional)  │                   │
│  │  (Users, Msgs,   │    │  (WS pub/sub for  │                   │
│  │   Sessions)      │    │   multi-instance)  │                   │
│  └─────────────────┘    └───────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Speech-to-Text Path
```
User speaks near microphone
    → Browser MediaRecorder API captures audio (webm/opus)
    → useMediaRecorder hook encodes chunks to Base64
    → WebSocket: {type:"audio_chunk", data:<base64>, mimeType:"audio/webm"}
    → Backend buffers chunks in memory
    → User stops recording
    → WebSocket: {type:"audio_end"}
    → Backend: STTService.transcribe(audio_bytes)
    → OpenRouter API: POST /audio/transcriptions (Whisper model)
    → Returns: {text, language, segments}
    → Backend: normalize_text() + detect_language()
    → Backend: classify_text() → emotion/intent labels via OpenRouter
    → If AI assist enabled: stream_chat() → token stream via SSE
    → WebSocket: {type:"transcript_final", text, confidence, lang}
    → WebSocket: {type:"sentiment", label, intent}
    → WebSocket: {type:"ai_partial", text} × N
    → WebSocket: {type:"ai_final", text}
    → Frontend: ChatTimeline shows messages, LiveCaptionPanel shows captions
    → Audio persisted to DB (messages table)
```

### Data Flow: Text-to-Speech Path
```
User types message
    → Click "Speak Aloud" button
    → WebSocket: {type:"user_text", text, requestTTS:true, lang:"en"}
    → Backend: TTSService.synthesize(text, language)
    → Edge TTS: Communicate(text, "en-US-JennyNeural")
    → Returns: MP3 bytes → Base64 encoded
    → WebSocket: {type:"tts_ready", audio:<base64>, duration}
    → Frontend: base64ToAudioUrl() → blob URL
    → new Audio(url).play()
    → Message displayed in chat timeline
```

### Frontend Architecture
```
src/app/                    ← Next.js App Router pages
├── page.tsx               ← Landing page (marketing)
├── auth/page.tsx          ← Redirects to /login
├── login/page.tsx         ← Login form
├── signup/page.tsx        ← Registration form
├── lobby/page.tsx         ← Session management hub
├── chat/[sessionId]/      ← Authenticated multi-user chat
└── app/page.tsx           ← Anonymous demo workspace

src/components/
├── landing/               ← Marketing sections
├── chat/                  ← ChatWorkspace, Timeline, Bubbles
├── audio/                 ← MicButton, Waveform
├── captions/              ← LiveCaptionPanel
├── avatar/                ← HologramSigner3D, RealisticSignerModel
├── a11y/                  ← AccessibilityControls
├── auth/                  ← AuthForm, AuthScaffold
├── common/                ← Button, Toast, Badge
└── layout/                ← AppLayout, Navbar, ControlDock

src/lib/
├── api/                   ← client.ts, websocket.ts, authApi.ts, sessionApi.ts
├── hooks/                 ← useSession, useTheme, useMediaRecorder
├── state/                 ← sessionStore.ts (Zustand)
└── i18n/                  ← en.ts, ar.ts, index.ts
```

### Backend Architecture
```
app/
├── main.py                ← FastAPI app, middleware stack, lifespan
├── api/v1/
│   ├── router.py          ← Registers all endpoint routers
│   └── endpoints/
│       ├── auth.py        ← Register/login/logout
│       ├── users.py       ← Profile CRUD
│       ├── sessions.py    ← Session management + WS tickets
│       ├── match.py       ← Matchmaking queue
│       ├── speech_to_text.py
│       ├── text_to_speech.py
│       ├── ai_response.py
│       ├── ws_session.py  ← WebSocket handler (main loop)
│       └── health.py      ← Health/readiness/metrics
├── core/
│   ├── config.py          ← Settings via pydantic-settings
│   ├── security.py        ← JWT, bcrypt
│   ├── rate_limit.py      ← SlowAPI limiter
│   ├── metrics.py         ← In-process perf metrics
│   └── logging_config.py  ← structlog setup
├── models/                ← SQLAlchemy ORM models
├── schemas/               ← Pydantic DTOs
├── crud/                  ← DB operation functions
├── services/              ← AI service adapters
│   ├── stt_service.py
│   ├── tts_service.py
│   ├── openrouter_client.py
│   ├── ai_context.py      ← Classifier + enhancer
│   ├── context_manager.py ← Conversation history
│   ├── language_detector.py
│   ├── sign_phrase_service.py
│   ├── matching_service.py
│   └── ws_redis.py        ← Redis pub/sub for multi-instance WS
├── realtime/
│   └── room_manager.py    ← In-memory WebSocket room state
└── db/
    ├── base.py, session.py, seed.py
```

---

## 3. TECHNOLOGIES USED

### Frontend Technologies

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **Next.js** | 16.x | React meta-framework, App Router, SSR/SSG | Industry standard, built-in routing, fast rendering |
| **React** | 19.x | UI component library | Ecosystem, hooks, state management |
| **TypeScript** | 5.8 | Type-safe JavaScript | Prevents bugs, better IDE support |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework | Rapid UI development, consistent design system |
| **Framer Motion** | 12.x | Animation library | Smooth, accessible animations for UI transitions |
| **Three.js** | 0.183 | 3D rendering engine | Required for 3D sign language avatar |
| **@react-three/fiber** | 9.x | React bindings for Three.js | Declarative 3D scene management |
| **@react-three/drei** | 10.x | Three.js helpers | Float, Sparkles, GLTF model loaders |
| **Zustand** | 5.x | Lightweight state management | Simple, performant, no boilerplate like Redux |
| **Lucide React** | 0.487 | Icon library | Clean, accessible SVG icons |
| **clsx + tailwind-merge** | latest | Conditional class names | Clean className management |
| **uuid** | 11.x | UUID generation | Client-side message ID generation |

### Backend Technologies

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **FastAPI** | 0.111+ | Python web framework | Async, auto-docs, Pydantic integration, fast |
| **Uvicorn** | 0.30+ | ASGI server | Production-grade async server for FastAPI |
| **Pydantic v2** | 2.7+ | Data validation & serialization | Type-safe request/response validation |
| **SQLAlchemy** | 2.0 async | ORM for database operations | Async support, works with both SQLite and PostgreSQL |
| **Alembic** | 1.13 | Database migration tool | Schema versioning and upgrades |
| **aiosqlite** | 0.20 | Async SQLite driver | Local development without PostgreSQL |
| **asyncpg** | 0.29 | Async PostgreSQL driver | Production database support |
| **bcrypt** | 4.1 | Password hashing | Industry-standard secure password storage |
| **python-jose** | 3.3 | JWT encoding/decoding | Secure token-based authentication |
| **openai** | 1.35 | OpenAI SDK | Access to Whisper STT API |
| **edge-tts** | 6.1 | Microsoft Edge TTS | Free, high-quality neural voices for EN + AR |
| **httpx** | 0.27 | Async HTTP client | For OpenRouter API calls |
| **slowapi** | 0.1.9 | Rate limiting middleware | Protect endpoints from abuse |
| **structlog** | 24.2 | Structured logging | Machine-readable JSON logs with context |
| **redis** | 5.0 | Redis client | Optional pub/sub for multi-instance WebSocket |
| **imageio-ffmpeg** | 0.6 | FFmpeg binary | Audio format conversion (webm → wav) |
| **python-multipart** | 0.0.9 | Multipart form parsing | Audio file upload handling |

### AI / External APIs

| Service | Provider | Used For |
|---|---|---|
| **Whisper** | OpenAI (via OpenRouter) | Speech-to-Text transcription |
| **gpt-audio-mini** | OpenAI (via OpenRouter) | Alternative STT + TTS |
| **Claude 3 Haiku** | Anthropic (via OpenRouter) | Chat, simplify, clarify, translate |
| **gpt-4o-mini** | OpenAI (via OpenRouter) | Text classification (emotion/intent) |
| **Edge TTS** | Microsoft (free, local) | Text-to-Speech (EN + AR voices) |
| **ElevenLabs** | ElevenLabs (optional) | Premium TTS voices |

### DevOps & Deployment

| Tool | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerization for local and production |
| **Vercel** | Frontend deployment (vercel.json present) |
| **Railway** | Backend deployment (railway.toml present) |
| **Redis** | Optional WebSocket broadcasting for horizontal scaling |

---

## 4. BACKEND DOCUMENTATION

### Backend Folder Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                        ← Entry point
│   ├── api/
│   │   ├── deps.py                    ← Dependency injection (get_current_user)
│   │   └── v1/
│   │       ├── router.py              ← Router assembly
│   │       └── endpoints/
│   │           ├── auth.py            ← POST /auth/register, /login, /logout
│   │           ├── users.py           ← GET/PATCH /users/me
│   │           ├── sessions.py        ← Sessions + WS ticket endpoints
│   │           ├── match.py           ← Matchmaking queue
│   │           ├── speech_to_text.py  ← POST /speech-to-text
│   │           ├── text_to_speech.py  ← POST /text-to-speech, GET /voices
│   │           ├── ai_response.py     ← POST /ai-response, /action
│   │           ├── ws_session.py      ← WS /ws/session/{id}
│   │           └── health.py          ← GET /health, /ready, /metrics
│   ├── core/
│   │   ├── config.py                  ← Settings (pydantic-settings)
│   │   ├── security.py                ← JWT + bcrypt
│   │   ├── rate_limit.py              ← SlowAPI limiter instance
│   │   ├── metrics.py                 ← In-process metrics collector
│   │   └── logging_config.py         ← structlog configuration
│   ├── models/                        ← SQLAlchemy ORM models
│   ├── schemas/                       ← Pydantic request/response schemas
│   ├── crud/                          ← Database operation functions
│   ├── services/                      ← AI and business logic services
│   ├── realtime/
│   │   └── room_manager.py            ← WebSocket connection registry
│   └── db/
│       ├── base.py                    ← DeclarativeBase
│       ├── session.py                 ← AsyncSession factory
│       └── seed.py                    ← Seed sign_mappings on startup
├── alembic/                           ← Migration scripts
├── tests/                             ← Pytest tests
├── requirements.txt
├── Dockerfile
├── .env.example
└── railway.toml                       ← Railway deployment config
```

### Main Backend Entry Point (`app/main.py`)

The FastAPI application initializes with:
1. **Lifespan context manager**: Seeds the sign_mappings table on startup, starts Redis WebSocket listener
2. **CORS middleware**: Allows frontend origin (configurable via ALLOWED_ORIGINS)
3. **SlowAPI middleware**: Global rate limiting
4. **Request instrumentation middleware**: Attaches correlation IDs, logs requests, records metrics, adds security headers
5. **Exception handlers**: ValueError (422), generic Exception (500)
6. **Router**: All API routes under `/api/v1`

### API Endpoints Reference

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|---|---|---|---|---|
| `/api/v1/health` | GET | Health check + service status | No | Default |
| `/api/v1/ready` | GET | Readiness probe | No | Default |
| `/api/v1/metrics` | GET | Performance metrics | No | 30/min |
| `/api/v1/auth/register` | POST | Create new user account | No | 20/min |
| `/api/v1/auth/login` | POST | Authenticate, receive JWT | No | 30/min |
| `/api/v1/auth/logout` | POST | Stateless logout | No | Default |
| `/api/v1/users/me` | GET | Get current user profile | Yes (JWT) | Default |
| `/api/v1/users/me` | PATCH | Update user profile | Yes (JWT) | Default |
| `/api/v1/sessions` | POST | Create new chat session | Yes (JWT) | Default |
| `/api/v1/sessions/join` | POST | Join session by invite code | Yes (JWT) | Default |
| `/api/v1/sessions/{id}` | GET | Get session details | Yes (JWT) | Default |
| `/api/v1/sessions/{id}/messages` | GET | Get paginated messages | Yes (JWT) | Default |
| `/api/v1/sessions/{id}/ws-ticket` | POST | Issue short-lived WS JWT | Yes (JWT) | Default |
| `/api/v1/match/enqueue` | POST | Enter matchmaking queue | Yes (JWT) | Default |
| `/api/v1/match/poll` | GET | Poll for match result | Yes (JWT) | Default |
| `/api/v1/match/dequeue` | DELETE | Leave matchmaking queue | Yes (JWT) | Default |
| `/api/v1/speech-to-text` | POST | Transcribe audio file | No | 30/min |
| `/api/v1/text-to-speech` | POST | Synthesize speech | No | 30/min |
| `/api/v1/voices` | GET | List available TTS voices | No | 10/min |
| `/api/v1/ai-response` | POST | Get AI response (streaming) | No | 30/min |
| `/api/v1/action` | POST | Run simplify/clarify/translate | No | 20/min |
| `/api/v1/ws/session/{id}` | WS | Real-time session WebSocket | Optional JWT | - |

### Detailed API Documentation

#### POST `/api/v1/auth/register`
- **Purpose**: Create a new user account
- **Body**: `{email, password, display_name, user_type (deaf|mute|both), locale}`
- **Response**: `{access_token, user: {id, email, display_name, user_type, locale}}`
- **Logic**: Checks for duplicate email, hashes password with bcrypt+SHA256, issues JWT

#### POST `/api/v1/auth/login`
- **Purpose**: Authenticate user
- **Body**: `{email, password}`
- **Response**: `{access_token, user}`
- **Logic**: Fetches user by email, verifies bcrypt hash, issues JWT

#### POST `/api/v1/speech-to-text`
- **Purpose**: Transcribe audio file to text
- **Body**: Multipart form — `audio` (file), `language` (string, default "auto")
- **Response**: `{text, confidence, detected_language, segments, processing_time_ms}`
- **Validation**: MIME type check, size limit (25MB), minimum length (100 bytes)
- **AI Used**: OpenAI Whisper via OpenRouter (or direct OpenAI API)

#### POST `/api/v1/text-to-speech`
- **Purpose**: Convert text to audio
- **Body**: `{text, language, voice?, speed?}`
- **Response**: `{audio_base64, duration_estimate_seconds, voice_used, language}`
- **AI Used**: Microsoft Edge TTS (default) or GPT-Audio-Mini or ElevenLabs

#### POST `/api/v1/ai-response`
- **Purpose**: Get AI language model response
- **Body**: `{messages: [{role, content}], task, stream (bool)}`
- **Response**: Streaming SSE `{token, task}` chunks, or `{text, task, processing_time_ms}`
- **AI Used**: OpenRouter (Claude 3 Haiku by default)

#### POST `/api/v1/action`
- **Purpose**: Run text transformation action
- **Body**: `{action: "simplify"|"clarify"|"translate", text, target_language?}`
- **Response**: `{original_text, result_text, action}`

#### WebSocket `/api/v1/ws/session/{session_id}`
- **Connection**: Optional `?token=<ws_ticket_jwt>` for authenticated room mode
- **Incoming Events**:
  - `{type:"audio_chunk", data:<base64>, mimeType}` — Append to audio buffer
  - `{type:"audio_end", lang}` — Process buffered audio through STT
  - `{type:"user_text", text, requestTTS, lang}` — Send text message
  - `{type:"action", action, text, messageId, targetLang}` — Run action on text
  - `{type:"ping"}` — Keepalive ping
- **Outgoing Events**:
  - `{type:"status", state}` — Current system state
  - `{type:"transcript_final", text, confidence, lang, messageId}` — STT result
  - `{type:"sentiment", label, intent, confidence, messageId}` — AI classification
  - `{type:"ai_partial", text, messageId}` — Streaming AI response token
  - `{type:"ai_final", text, messageId}` — Complete AI response
  - `{type:"tts_ready", audio, messageId, duration, voice}` — TTS audio
  - `{type:"ai_enhancement", text, messageId}` — Enhanced message text
  - `{type:"sign_suggestion", phraseKey, assetUrl}` — Sign language suggestion
  - `{type:"message", kind, text, senderId, lang}` — Peer message (room mode)
  - `{type:"error", message, code}` — Error notification
  - `{type:"pong"}` — Keepalive response

### Authentication Flow
```
Client → POST /auth/register or /auth/login
       ← {access_token: "eyJ..."} (JWT, expires in 7 days)
Client stores token in localStorage

Protected request:
Client → GET /users/me  [Authorization: Bearer <token>]
Backend: decode_token() → user UUID → get_user_by_id() → User object
       ← {id, email, display_name, ...}

WebSocket connection:
Client → POST /sessions/{id}/ws-ticket  [Authorization: Bearer <token>]
       ← {token: "<ws_ticket>", expires_in: 900}
Client → WS /ws/session/{id}?token=<ws_ticket>
Backend: decode_token() → verify type=="ws" → verify sid matches → allow
```

### Key Backend Services

**STTService (`services/stt_service.py`)**
- Supports three providers: `openrouter`, `gpt-audio-mini`, `openai`
- `transcribe()` dispatches to the correct provider
- `_transcribe_via_whisper()` — calls `/audio/transcriptions` endpoint
- `_transcribe_via_chat()` — uses gpt-audio-mini chat completions with base64 audio
- Automatic fallback: if Whisper returns 5xx, tries `gpt-4o-mini-transcribe`, then chat fallback
- `_convert_audio_for_gpt()` — uses FFmpeg to transcode webm → wav when needed

**TTSService (`services/tts_service.py`)**
- Supports three providers: `edge`, `gpt-audio-mini`, `elevenlabs`
- `synthesize()` — returns `(base64_mp3, duration_seconds)`
- `_synthesize_edge()` — Microsoft Edge TTS via `edge_tts.Communicate`
- `_synthesize_gpt_audio()` — chat completions with audio output modality
- `_synthesize_elevenlabs()` — ElevenLabs REST API
- Automatic fallback: Edge TTS failure → gpt-audio-mini (if configured)

**OpenRouterClient (`services/openrouter_client.py`)**
- `stream_chat()` — Streams tokens from OpenRouter SSE
- `complete()` — Non-streaming completion
- `complete_with_model()` — Used for classifier (gpt-4o-mini, JSON mode)
- `stream_action()` — Applies task-specific prompts for simplify/clarify/translate
- System prompt: "AI communication assistant for deaf and mute individuals"

**LanguageDetector (`services/language_detector.py`)**
- `detect_language()` — Unicode range heuristic (Arabic U+0600-U+06FF vs Latin a-zA-Z)
- Returns confidence 0-1, favors language with >60% character ratio
- `normalize_text()` — Strips control characters, NFC unicode normalization
- `compute_readability_score()` — 0-100 score based on word/sentence length

**AI Context Service (`services/ai_context.py`)**
- `classify_text()` — Sends text to gpt-4o-mini, returns JSON: `{emotion, intent, urgency, confidence}`
- `enhance_text()` — Rewrites message for deaf-friendly clarity using LLM

**ContextManager (`services/context_manager.py`)**
- Registry of per-session conversation history
- `get_or_create(session_id)` — Returns or creates context
- Maintains last N messages (configurable `MAX_CONTEXT_MESSAGES`)

**SignPhraseService (`services/sign_phrase_service.py`)**
- `best_sign_suggestion()` — Fuzzy matches text against `sign_mappings` DB table
- Canonical phrase patterns (e.g., "how are you" and variants)
- Returns `{phraseKey, assetUrl}` — SVG card placeholder or stored media URL

---

## 5. FRONTEND DOCUMENTATION

### Frontend Folder Structure

```
frontend/
├── src/
│   ├── app/                          ← Next.js App Router
│   │   ├── layout.tsx               ← Root HTML layout (fonts, metadata)
│   │   ├── page.tsx                 ← Landing page
│   │   ├── globals.css              ← CSS variables, utility classes
│   │   ├── loading.tsx              ← Global loading spinner
│   │   ├── error.tsx                ← Global error boundary
│   │   ├── not-found.tsx            ← 404 page
│   │   ├── auth/page.tsx            ← Redirect to /login
│   │   ├── login/page.tsx           ← Login page
│   │   ├── signup/page.tsx          ← Registration page
│   │   ├── lobby/page.tsx           ← Session management
│   │   ├── chat/[sessionId]/page.tsx ← Authenticated chat room
│   │   └── app/
│   │       ├── layout.tsx           ← App section layout
│   │       ├── page.tsx             ← Anonymous demo workspace
│   │       ├── dashboard/page.tsx   ← Dashboard (placeholder)
│   │       ├── sessions/page.tsx    ← Sessions list
│   │       ├── sessions/[id]/page.tsx ← Session detail
│   │       ├── preferences/page.tsx ← User preferences
│   │       └── help/page.tsx        ← Help page
│   ├── components/
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx      ← Main hero with video modal
│   │   │   ├── ProblemSection.tsx   ← Problem statement
│   │   │   ├── AnimatedPreview.tsx  ← 3D avatar demo preview
│   │   │   ├── FeaturesBento.tsx    ← Feature cards grid
│   │   │   ├── AccessibilitySection.tsx
│   │   │   ├── ImpactSection.tsx    ← Statistics / impact
│   │   │   └── AcademicSection.tsx  ← Academic context
│   │   ├── chat/
│   │   │   ├── ChatWorkspace.tsx    ← Main chat orchestrator
│   │   │   ├── ChatTimeline.tsx     ← Message list
│   │   │   ├── ChatBubble.tsx       ← Individual message bubble
│   │   │   └── StatusRail.tsx       ← Connection/status indicator
│   │   ├── audio/
│   │   │   ├── MicButton.tsx        ← Record button
│   │   │   └── WaveformAnimation.tsx ← Visual audio waveform
│   │   ├── captions/
│   │   │   └── LiveCaptionPanel.tsx ← Real-time caption display
│   │   ├── avatar/
│   │   │   ├── HologramSigner3D.tsx ← Three.js 3D signer robot
│   │   │   ├── RealisticSignerModel.tsx ← GLB model loader
│   │   │   └── SignPreview.tsx      ← Sign suggestion card
│   │   ├── a11y/
│   │   │   └── AccessibilityControls.tsx ← High contrast + font size
│   │   ├── auth/
│   │   │   ├── AuthForm.tsx         ← Login/register form
│   │   │   └── AuthScaffold.tsx     ← Auth page wrapper
│   │   ├── common/
│   │   │   ├── Button.tsx           ← Reusable button
│   │   │   ├── Toast.tsx            ← Toast notification
│   │   │   └── Badge.tsx            ← Status badge
│   │   ├── app/
│   │   │   ├── ChatArea.tsx
│   │   │   ├── LiveCaption.tsx
│   │   │   ├── MicrophoneButton.tsx
│   │   │   ├── SessionsWorkspacePage.tsx
│   │   │   └── Sidebar.tsx
│   │   └── layout/
│   │       ├── AppLayout.tsx        ← Main app shell
│   │       ├── Navbar.tsx           ← Top navigation
│   │       └── ControlDock.tsx      ← Bottom input + mic controls
│   └── lib/
│       ├── api/
│       │   ├── client.ts            ← HTTP client, token storage
│       │   ├── authApi.ts           ← register/login/logout/fetchMe
│       │   ├── sessionApi.ts        ← Sessions, match, WS ticket
│       │   └── websocket.ts         ← SessionWebSocket class
│       ├── hooks/
│       │   ├── useSession.ts        ← WebSocket orchestrator hook
│       │   ├── useMediaRecorder.ts  ← Browser MediaRecorder API
│       │   ├── useTheme.ts          ← Apply theme CSS variables
│       │   └── useSafeReducedMotion.ts ← prefers-reduced-motion
│       ├── state/
│       │   └── sessionStore.ts      ← Zustand global store
│       ├── i18n/
│       │   ├── en.ts                ← English translations
│       │   ├── ar.ts                ← Arabic translations
│       │   └── index.ts             ← useTranslations hook
│       └── utils.ts                 ← Utility functions
├── public/
│   └── models/
│       ├── signer.glb               ← 3D humanoid model (GLTF/GLB)
│       └── README.md
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json                      ← Vercel deployment config
```

### Main Pages Documentation

| Page | Path | Purpose | API Calls |
|---|---|---|---|
| **Landing** | `/` | Marketing page with hero, features, demo | None |
| **Login** | `/login` | User authentication | POST /auth/login |
| **Signup** | `/signup` | User registration | POST /auth/register |
| **Lobby** | `/lobby` | Session creation, join, matchmaking | POST /sessions, /sessions/join, /match/* |
| **Chat** | `/chat/[sessionId]` | Authenticated real-time chat room | WS /ws/session/{id}, GET /sessions/{id}/messages |
| **App** | `/app` | Anonymous demo workspace | WS /ws/session/{id} |

### State Management (Zustand)

The `sessionStore.ts` manages all runtime UI state:

| State Field | Type | Description |
|---|---|---|
| `sessionId` | string | Current WebSocket session UUID |
| `messages` | ChatMessage[] | Full chat message history |
| `liveCaption` | string | Real-time partial transcript |
| `liveAiResponse` | string | Streaming AI response in progress |
| `systemStatus` | idle/listening/processing/speaking | Current operation state |
| `isConnected` | boolean | WebSocket connection status |
| `language` | "en" / "ar" | Selected interface language |
| `isHighContrast` | boolean | High contrast mode flag |
| `fontSize` | normal/large/xlarge | Accessibility font size |
| `signPreview` | {phraseKey, assetUrl} | Current sign suggestion |
| `activeAudioId` | string | Currently playing TTS message ID |

### WebSocket Client (`lib/api/websocket.ts`)

The `SessionWebSocket` class manages:
- **Auto-reconnect**: Exponential backoff, up to 5 attempts (delay × 1.5^attempt)
- **Ping/pong**: 25-second interval to keep connection alive
- **Event system**: `on(type, handler)` / `off(type, handler)` dispatch pattern
- **Methods**: `sendAudioChunk()`, `sendAudioEnd()`, `sendText()`, `sendAction()`

### useSession Hook (`lib/hooks/useSession.ts`)

The central React hook that:
1. Creates `SessionWebSocket` instance on mount
2. Registers handlers for all WebSocket event types
3. Maps server message IDs to local Zustand message IDs
4. Handles partial AI streaming updates
5. Plays TTS audio using Web Audio API (blob URLs)
6. Exposes: `sendText`, `sendAudioChunk`, `sendAudioEnd`, `sendAction`

### Internationalization (i18n)

Supports English (`en.ts`) and Arabic (`ar.ts`). Translations cover:
- Status messages (idle, listening, processing, speaking)
- Control labels (start/stop listening, send, speak aloud)
- Action labels (simplify, clarify, translate)
- Error messages
- Accessibility labels
- Mode descriptions

Arabic translations use proper RTL formatting. Language can be toggled at runtime without page reload.

### 3D Avatar Component (`components/avatar/HologramSigner3D.tsx`)

Built with Three.js / React Three Fiber. Features:
- **Automatic model detection**: Checks if `/models/signer.glb` exists; falls back to procedural robot
- **Procedural robot**: Built from Three.js primitives (capsule, sphere, cylinder geometries)
- **8 sign poses**: neutral, wave, thank-you, yes, no, please, help, question
- **Smooth animation**: Uses `MathUtils.damp()` for smooth interpolation between poses
- **Dynamic effects**: Body sway, head nod (yes pose), head shake (no pose), waving arm
- **Visual style**: Holographic cyan glow, metallic materials, rotating ring, sparkle particles
- **Scene**: Fog, ambient + directional + point lights, floating particles

### Accessibility Features

- **High Contrast Mode**: CSS custom property swap for WCAG AAA contrast
- **Font Scaling**: 3 levels (normal, large, xlarge) applied via CSS variables
- **ARIA labels**: Every interactive element has descriptive aria-label
- **Keyboard navigation**: Full Tab/Enter navigation with visible focus rings
- **ARIA live regions**: System status changes announced to screen readers
- **RTL support**: Arabic layout mirrors horizontal direction
- **Reduced motion**: `useSafeReducedMotion` hook disables animations when user prefers
- **No audio-only alerts**: All state changes are visually communicated

---

## 6. AI / MACHINE LEARNING MODEL DOCUMENTATION

### Overview of AI Components

The system uses three categories of AI:
1. **Speech-to-Text (STT)**: Converts audio to text
2. **Text-to-Speech (TTS)**: Converts text to natural-sounding audio
3. **Large Language Model (LLM)**: Understands and enhances text

---

### Component 1: Speech-to-Text (Whisper)

**Model Name**: OpenAI Whisper-1 (via OpenRouter)
**Model Type**: Transformer-based automatic speech recognition (ASR)
**Task**: Multi-language audio transcription

**What is Whisper?**
Whisper is a large-scale neural network trained by OpenAI on 680,000 hours of multilingual audio. It is an encoder-decoder Transformer that processes mel spectrogram features of audio and generates token sequences representing the transcript. It natively supports 99 languages including Arabic.

**How Input is Prepared:**
1. Browser captures audio via `MediaRecorder` API (WebM format, Opus codec)
2. Audio is chunked (Base64 encoded) and sent over WebSocket
3. Server buffers chunks in `audio_buffer: bytearray`
4. On `audio_end` event, buffer is passed to `STTService.transcribe()`
5. Audio bytes are wrapped in `io.BytesIO` with a filename extension (`.webm`)
6. For gpt-audio-mini path: FFmpeg converts webm → wav (PCM 16-bit)

**How Inference is Done:**
```python
response = await client.audio.transcriptions.create(
    model="openai/whisper-1",
    file=audio_file,              # BytesIO with .webm extension
    language=language_hint,       # e.g. "ar" or None for auto-detect
    response_format="verbose_json",
    timestamp_granularities=["segment"],
)
```

**Output Processing:**
- `response.text` → normalized with `normalize_text()` (removes control chars, NFC)
- `response.language` → detected language code ("ar", "en", etc.)
- `response.segments` → timestamps per segment
- Confidence: 0.92 if segments exist, 0.85 otherwise (no native confidence from Whisper API)

**Why Whisper was Chosen:**
- Best-in-class multilingual ASR, especially for Arabic
- Handles noisy environments, accents, and natural speech patterns
- Processes complete utterances for better accuracy vs streaming ASR
- No per-minute usage fee via OpenRouter (pay per API call)
- Supports audio/webm directly (format from browser MediaRecorder)

**Fallback Chain:**
1. `openai/whisper-1` via OpenRouter (primary)
2. `openai/gpt-4o-mini-transcribe` via OpenRouter (if whisper returns 5xx)
3. `openai/gpt-audio-mini` via chat completions (if audio format compatible)

**Limitations:**
- Not truly real-time: processes complete audio segments (2-15 second chunks)
- Confidence score is approximate (no native confidence output from Whisper API)
- Latency: 1-3 seconds typical for a 5-second audio clip
- Requires internet connectivity (cloud API)

---

### Component 2: Text-to-Speech (Edge TTS)

**Model Name**: Microsoft Edge TTS Neural Voices
**Provider**: Microsoft (free, accessed via `edge-tts` Python library)
**Model Type**: Neural TTS (SSML-based)
**Task**: Natural language text synthesis

**English Voices Used:**
- `en-US-JennyNeural` (female, default)
- `en-US-AndrewNeural` (male)

**Arabic Voices Used:**
- `ar-SA-ZariyahNeural` (female, default)
- `ar-SA-HamedNeural` (male)

**How it Works:**
```python
communicate = edge_tts.Communicate(text, resolved_voice, rate="+0%")
buffer = io.BytesIO()
async for chunk in communicate.stream():
    if chunk["type"] == "audio":
        buffer.write(chunk["data"])
audio_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
```

**Output**: MP3 audio encoded as Base64 string

**Why Edge TTS was Chosen:**
- Free, no API key required for basic usage
- High-quality Microsoft Azure Neural voices
- Excellent Arabic language support
- Low latency (no external API round-trip beyond SSML request)
- Supports speed/rate adjustment via SSML

**Alternative TTS Providers:**
- `gpt-audio-mini`: Same API key as STT/LLM, but paid and slightly less natural
- `elevenlabs`: Highest quality, but requires paid API key

---

### Component 3: Large Language Model (OpenRouter → Claude 3 Haiku)

**Model Name**: `anthropic/claude-3-haiku` (default, configurable)
**Provider**: Anthropic (accessed via OpenRouter routing service)
**Model Type**: Large Language Model (LLM), Transformer-based decoder
**Task**: Conversational AI, text simplification, clarification, translation

**What is OpenRouter?**
OpenRouter is an API gateway that provides unified access to multiple AI models (Claude, GPT-4, Mistral, Llama, etc.) through a single API key. It uses the OpenAI API format, making model switching easy.

**Why Claude 3 Haiku?**
- Fast response time (important for real-time chat)
- High quality in both English and Arabic
- Follows instructions precisely (important for simplify/clarify tasks)
- Cost-effective for high-volume interactions
- Anthropic's safety training reduces harmful outputs

**System Prompt** (from `openrouter_client.py`):
```
You are an AI communication assistant for deaf and mute individuals.
Your role is to facilitate clear, respectful communication.
- Use clear, simple, and direct language
- Avoid jargon, complex idioms, or ambiguous phrasing
- Be concise — every word matters
- Respond in the same language as the user unless asked to translate
```

**Task-Specific Prompts:**

| Task | Prompt Template |
|---|---|
| `simplify` | "Rewrite using very simple words and short sentences. Preserve the full meaning." |
| `clarify` | "Explain clearly. Add helpful context. Use simple language." |
| `translate_to_ar` | "Translate to Arabic. Use clear, natural Modern Standard Arabic." |
| `translate_to_en` | "Translate to English. Use clear, natural English." |

**Text Classification** (secondary AI task):
- Model: `openai/gpt-4o-mini` (faster, cheaper for classification)
- System prompt: "Reply with ONLY valid JSON: {emotion, intent, urgency, confidence}"
- Labels: emotion ∈ {happy, sad, angry, neutral, anxious}, intent ∈ {question, statement, urgent, other}
- Used for: sentiment display in UI, AI enhancement context

**AI Enhancement**:
- Model: same as main LLM (configurable separately)
- Rewrites message for "deaf-friendly clarity: short sentences, plain words, neutral supportive tone, no sarcasm, no idioms"

**Streaming Architecture:**
```
Client → POST /ai-response (stream=true) or WS {type:"user_text"}
Backend → OpenRouter: POST /chat/completions (stream:true)
       ← SSE stream: data: {"choices":[{"delta":{"content":"token"}}]}
Backend parses each line → extracts content token → forwards to client
Client receives: WS {type:"ai_partial", text:"growing text..."}
Final: WS {type:"ai_final", text:"complete response"}
```

**Context Management:**
- `ContextManager` (per session) maintains last 20 messages (configurable)
- Each message stored as `{role: "user"|"assistant", content: "..."}"`
- Prepended with system prompt on each LLM call
- Session context deleted on WebSocket disconnect

---

### Doctor Questions About The Model

**Q1: Why did you choose Whisper for speech recognition?**
A: Whisper is the best open-access model for multilingual ASR, especially Arabic. It was trained on 680,000 hours of diverse audio including Arabic dialects. Competitors like Google STT require more complex setup and often have poorer Arabic support. Whisper via OpenRouter requires only one API key and handles Arabic and English natively.

**Q2: What type of model is Whisper?**
A: Whisper is an encoder-decoder Transformer. The encoder processes mel spectrogram features of the audio input, and the decoder generates the transcription token by token. It's a sequence-to-sequence model similar in architecture to T5 or BART.

**Q3: How does the model receive audio input?**
A: The browser's MediaRecorder API captures audio in WebM/Opus format. JavaScript encodes it as Base64 and sends it over the WebSocket. The backend buffers all chunks, then when recording stops, passes the complete byte array to the STT service. The audio is wrapped as a file object and submitted to the Whisper API endpoint `/audio/transcriptions`.

**Q4: How does the model generate output?**
A: Whisper generates a text transcript via beam search decoding. The API returns the full text, detected language, and optionally per-segment timestamps. The backend then normalizes the text (strips control characters, normalizes Unicode), runs language detection heuristics, and sends the result back via WebSocket.

**Q5: What is the confidence score?**
A: Whisper's API does not return a native per-token confidence probability. We assign a heuristic confidence: 0.92 if the response includes word/segment timestamps (indicating successful detailed recognition), and 0.85 if only the plain transcript is returned. This is disclosed as an approximation.

**Q6: Why not use Google Speech-to-Text?**
A: Google STT would require a Google Cloud API key and account setup, adding deployment complexity. OpenRouter consolidates all AI APIs under one key. Additionally, Whisper has superior multilingual performance, especially for Arabic, compared to Google STT in our testing.

**Q7: What preprocessing is needed?**
A: The audio undergoes no preprocessing on the client — the browser's native MediaRecorder is used as-is. On the server, if the gpt-audio-mini path is used, FFmpeg converts WebM → WAV (PCM 16-bit, 44.1kHz) because that model requires WAV or MP3 input. For Whisper, WebM is supported directly.

**Q8: What happens if the model gives wrong output?**
A: The user can see the transcript in the chat timeline and can use the "Clarify" AI action to get a better explanation, or they can manually correct it by typing. The system does not auto-correct or hide poor transcriptions — transparency is important for accessibility.

**Q9: How is the LLM used differently from STT?**
A: STT (Whisper) converts audio to text — it's a perception task. The LLM (Claude 3 Haiku) performs language understanding tasks: chatting, simplifying complex language, clarifying ambiguous messages, translating between Arabic and English. They serve completely different purposes.

**Q10: Is the model trained or pre-trained?**
A: Both Whisper and Claude 3 Haiku are pre-trained models that we use via API — no fine-tuning was performed in this project. The models bring billions of parameters of learned knowledge, and we configure their behavior through carefully designed system prompts and task-specific prompt templates.

**Q11: What is the difference between training and inference in your project?**
A: This project performs only inference — we send inputs to pre-trained models and receive outputs. We do not train any model. Training involves learning from large datasets and updating model weights, which requires significant GPU resources and labeled data. Inference uses a frozen pre-trained model to make predictions on new inputs.

**Q12: Is the result deterministic?**
A: Not fully. For STT/Whisper, the output is relatively deterministic for the same audio. For the LLM, we use temperature=0.7 for chat (non-deterministic, more creative) and temperature=0.2 for classification (near-deterministic). This means the same message could produce slightly different simplifications each time, but classification results are very consistent.

**Q13: How do you handle LLM errors?**
A: All LLM calls are wrapped in try/except blocks. Errors are caught, logged with structlog (including the error message and session context), and a user-friendly error message is sent back via WebSocket: `{type:"error", message:"AI response failed", code:"ai_error"}`. The UI displays the error and returns to idle state.

**Q14: How does the backend connect to the AI models?**
A: For the LLM and Whisper (via OpenRouter): we use httpx AsyncClient with the Authorization header containing the API key. For Edge TTS: we use the `edge-tts` Python library which internally makes SSML requests to Microsoft servers. The entire backend is async, so AI calls don't block other requests.

**Q15: Can the model work in real time?**
A: Partially. The LLM uses streaming (SSE) so tokens appear as they're generated, giving the impression of real-time output. STT is not truly real-time — it processes complete utterances (when the user stops speaking), not word-by-word. Edge TTS synthesizes the entire audio before sending, but the latency is typically under 2 seconds. True word-by-word real-time STT would require a different API (e.g., Deepgram streaming).

**Q16: How do you evaluate the AI model performance?**
A: We measure:
- Processing time (milliseconds) for each operation, tracked in `metrics.py`
- Error rate per operation (tracked in MetricsCollector)
- Readability score of AI responses (computed by `compute_readability_score()`)
- User feedback via the simplify/clarify actions (if user needs to simplify, original was complex)

**Q17: What are the model limitations?**
A: 
- Whisper: latency (1-3 seconds), no real-time word-by-word streaming, approximate confidence
- Claude 3 Haiku: can occasionally produce overly long or incorrectly simplified responses
- Edge TTS: requires internet for Arabic voices, no emotion/prosody control
- Language detection: heuristic-based, may fail for mixed-language text
- Sign language: only phrase-level matching, no actual motion capture animation

**Q18: What are the ethical concerns?**
A: 
- Audio data is sent to third-party APIs (OpenRouter, OpenAI) — users should be informed
- LLM may produce biased or incorrect text in safety-critical contexts (medical, legal)
- Arabic dialect handling: Whisper works best with Modern Standard Arabic; dialects may have lower accuracy
- Sign language representation: The 3D avatar uses simplified pose approximations, not linguistically precise ASL/ISL

**Q19: How do you protect user data?**
A: 
- Audio is never stored permanently — only processed in memory
- Messages are stored in the database only in "room mode" (authenticated sessions)
- JWT tokens expire (7 days for access, 15 minutes for WebSocket tickets)
- No personal audio data is logged or retained
- API keys are environment variables, never in source code
- Environment files (`.env`) are in `.gitignore`

**Q20: Can the model be improved?**
A: Yes, several improvements are planned:
- Fine-tune Whisper on deaf-specific speech patterns (slower, fragmented speech)
- Implement streaming ASR (Deepgram) for word-by-word captions
- Add sign language video generation using diffusion models or motion capture
- Add language model fine-tuning on accessibility-specific conversational datasets
- Add user feedback loop to improve simplification quality

**Q21: What happens if the API key is missing?**
A: If `OPENROUTER_API_KEY` is not set:
- STT will raise a `ValueError: OPENROUTER_API_KEY is required`
- TTS (edge) will still work (no key needed)
- LLM will not function, and AI assist features will be silently disabled
- The health endpoint reports service status

**Q22: Why OpenRouter instead of direct Anthropic API?**
A: OpenRouter provides several advantages:
1. One API key for multiple models (Whisper STT, Claude LLM, gpt-audio-mini TTS)
2. Model fallback and routing built in
3. Easy model switching (change one environment variable)
4. Unified billing and monitoring

**Q23: How does the sign language feature work?**
A: The `sign_phrase_service.py` uses regex pattern matching to find known phrases in the transcript. If a match is found (e.g., "how are you" and its variants), a sign suggestion card is generated and sent to the frontend via WebSocket `{type:"sign_suggestion"}`. The frontend displays an SVG card with the phrase text. A 3D avatar demonstrates approximate sign poses using procedural Three.js animation.

**Q24: What dataset is used?**
A: No custom dataset was used — all models are pre-trained. The sign_mappings database table can be populated with phrase-to-media mappings (currently a placeholder). No model training was performed.

**Q25: How scalable is the AI system?**
A: The AI calls are all async and non-blocking. Multiple sessions can process AI requests concurrently. Redis pub/sub enables horizontal scaling (multiple backend instances). Rate limiting prevents API quota exhaustion. For very high load, a task queue (Celery) could be added for STT/TTS processing.

---

## 7. DATABASE DOCUMENTATION

### Database Type
- **Development**: SQLite (`hearme.db`) via `aiosqlite` driver
- **Production**: PostgreSQL via `asyncpg` driver
- **ORM**: SQLAlchemy 2.0 async with `DeclarativeBase`
- **Migrations**: Alembic (one initial migration creates all tables)

### Database Schema

#### Table: `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, default uuid4 | User identifier |
| `email` | VARCHAR(320) | UNIQUE, INDEX, NOT NULL | Login email |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash of SHA256(password) |
| `display_name` | VARCHAR(120) | NOT NULL | Visible name in chat |
| `user_type` | VARCHAR(16) | NOT NULL | "deaf", "mute", or "both" |
| `locale` | VARCHAR(32) | default "en" | Interface language preference |
| `font_scale` | VARCHAR(16) | default "normal" | Accessibility font size preference |
| `high_contrast` | BOOLEAN | default false | High contrast mode preference |
| `created_at` | TIMESTAMP(TZ) | server_default now() | Account creation time |
| `updated_at` | TIMESTAMP(TZ) | auto-update | Last profile update |
| `last_seen_at` | TIMESTAMP(TZ) | nullable | Last activity timestamp |

#### Table: `sessions`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Session identifier |
| `mode` | VARCHAR(16) | NOT NULL | "direct" or "matched" |
| `invite_code` | VARCHAR(32) | UNIQUE, INDEX, nullable | Share code for joining |
| `created_by` | UUID | FK → users.id | Session creator |
| `ai_assist_enabled` | BOOLEAN | default true | Whether AI assist is active |
| `created_at` | TIMESTAMP(TZ) | server_default now() | Creation time |
| `closed_at` | TIMESTAMP(TZ) | nullable | Session end time |

#### Table: `session_participants`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `session_id` | UUID | PRIMARY KEY, FK → sessions.id | Part of composite PK |
| `user_id` | UUID | PRIMARY KEY, FK → users.id | Part of composite PK |
| `role` | VARCHAR(16) | NOT NULL | "deaf" or "mute" |
| `joined_at` | TIMESTAMP(TZ) | server_default now() | When user joined |
| `left_at` | TIMESTAMP(TZ) | nullable | When user left |

#### Table: `messages`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Message identifier |
| `session_id` | UUID | FK → sessions.id, INDEX | Owning session |
| `sender_id` | UUID | FK → users.id, nullable | Who sent it (null for AI) |
| `kind` | VARCHAR(32) | NOT NULL | "transcript" or "user_text" |
| `content_text` | TEXT | NOT NULL | The message content |
| `raw_audio_ref` | VARCHAR(512) | nullable | Reference to stored audio (future) |
| `stt_provider` | VARCHAR(64) | nullable | Which STT provider was used |
| `tts_provider` | VARCHAR(64) | nullable | Which TTS provider was used |
| `created_at` | TIMESTAMP(TZ) | INDEX | Message timestamp |

#### Table: `message_ai_metadata`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `message_id` | UUID | PRIMARY KEY, FK → messages.id | One-to-one with message |
| `sentiment_label` | VARCHAR(32) | nullable | Detected emotion |
| `sentiment_score` | FLOAT | nullable | Confidence of emotion |
| `intent` | VARCHAR(32) | nullable | Detected intent |
| `llm_model` | VARCHAR(128) | nullable | Model used for enhancement |
| `prompt_version` | VARCHAR(32) | nullable | Prompt template version |
| `tokens_in` | INTEGER | nullable | Input tokens (future) |
| `tokens_out` | INTEGER | nullable | Output tokens (future) |
| `enhancement_text` | TEXT | nullable | AI-enhanced version of message |

#### Table: `sign_mappings`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Mapping identifier |
| `phrase_key` | VARCHAR(256) | INDEX | The phrase text to match |
| `locale` | VARCHAR(16) | INDEX | Language code ("en" or "ar") |
| `asset_url` | TEXT | NOT NULL | URL or data URI of sign media |
| `priority` | INTEGER | default 0 | Ordering priority |

#### Table: `match_queue` (from `models/match_queue.py`)

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Queue entry identifier |
| `user_id` | UUID | User waiting for match |
| `queue_role` | VARCHAR | Role requested ("deaf" or "mute") |
| `session_id` | UUID (nullable) | Assigned session after match |
| `status` | VARCHAR | "waiting" or "matched" |
| `created_at` | TIMESTAMP | Entry time |

### Entity Relationships

```
users ──────────────────────────────────────────────────────┐
 │                                                           │
 │ created_by (1:N)       user_id (M:N via session_participants)
 ▼                                      ▼
sessions ──── session_participants ──── users
 │
 │ session_id (1:N)
 ▼
messages ──── message_ai_metadata (1:1)

users ──── match_queue (1:N)
           (matched users → session assigned)

sign_mappings (standalone, looked up by phrase_key + locale)
```

### Data Flow for a Typical Message
1. User speaks → audio received at WebSocket
2. STT result → `message_crud.create_message(session_id, sender_id, kind="transcript", content_text)`
3. AI classification → `message_crud.upsert_ai_metadata(message_id, sentiment_label, intent, enhancement_text)`
4. Message history → `message_crud.list_messages(session_id, limit, offset)` via REST API

---

## 8. FEATURES DOCUMENTATION

### Complete Feature Table

| # | Feature | Technical Components | User Benefit |
|---|---|---|---|
| 1 | **Real-time Speech-to-Text** | Whisper API, WebSocket, MediaRecorder | Deaf users see what others are saying |
| 2 | **Text-to-Speech** | Edge TTS, base64 audio, Web Audio API | Mute users have their text spoken aloud |
| 3 | **AI Chat Assistant** | Claude 3 Haiku, streaming SSE | Smart conversational partner |
| 4 | **Message Simplification** | LLM with simplify prompt | Complex text rewritten in plain language |
| 5 | **Message Clarification** | LLM with clarify prompt | Ambiguous messages explained |
| 6 | **Message Translation** | LLM with translate prompt | EN↔AR translation |
| 7 | **Live Captions** | WebSocket, LiveCaptionPanel | Real-time partial transcript display |
| 8 | **Sign Language Suggestions** | sign_phrase_service, sign_mappings DB | Sign language phrase cards |
| 9 | **3D Hologram Avatar** | Three.js, React Three Fiber | Visual sign pose demonstrations |
| 10 | **User Authentication** | JWT, bcrypt, SQLAlchemy | Secure identity and session persistence |
| 11 | **Session Management** | Sessions API, invite codes | Persistent multi-user chat rooms |
| 12 | **Matchmaking** | MatchQueue, polling | Auto-pair deaf+mute users |
| 13 | **Bilingual UI** | i18n (en.ts/ar.ts), RTL CSS | Native Arabic support |
| 14 | **High Contrast Mode** | CSS custom properties | WCAG AAA accessibility |
| 15 | **Font Size Scaling** | Zustand state, CSS variables | Readability for vision impairment |
| 16 | **Keyboard Navigation** | ARIA, focus rings | Screen reader + keyboard users |
| 17 | **Multi-Provider AI** | Configurable STT/TTS/LLM providers | Flexibility and reliability |
| 18 | **Rate Limiting** | SlowAPI | Protects API from abuse |
| 19 | **Structured Logging** | structlog | Production observability |
| 20 | **Performance Metrics** | MetricsCollector, /metrics endpoint | Monitor latency and error rates |

---

## 9. USER FLOW

### Deaf User Flow (Step by Step)

**Simple User Explanation:**
1. Open HearMeAI in your browser
2. If using the demo, go to `/app` — no login needed
3. Someone near you speaks into the microphone
4. Click the green "Listen" button (microphone icon)
5. As they speak, captions appear live in the caption panel
6. When done, click "Stop" — the final transcript appears in the chat
7. If the message is unclear, click "Simplify" on any message
8. To reply, type your message in the text box and click "Send"
9. To have your typed message spoken aloud, click "Speak Aloud"

**Technical Developer Flow:**
1. Frontend: `/app` page → `ChatWorkspace` component mounted
2. `useSession()` hook creates `SessionWebSocket`, connects to `ws://localhost:8000/api/v1/ws/session/{uuid}`
3. User clicks mic → `useMediaRecorder.startRecording()` → `MediaRecorder.start(500ms slices)`
4. Each 500ms slice: `onDataAvailable` → base64 encode → `ws.sendAudioChunk(base64, "audio/webm")`
5. Backend: buffers in `audio_buffer: bytearray`, sets status "listening"
6. User stops → `ws.sendAudioEnd()` → `{type:"audio_end"}`
7. Backend: `handle_audio_end()` → `STTService.transcribe(audio_buffer)` → Whisper API
8. Backend: `normalize_text()` → `detect_language()` → `classify_text()` (emotion/intent)
9. Backend sends: `{type:"transcript_final", text, confidence, lang}` + `{type:"sentiment"}`
10. If AI assist: `context.add("user", text)` → `stream_chat(ctx.messages)` → SSE tokens
11. Backend streams: `{type:"ai_partial"}` × N → `{type:"ai_final"}`
12. Frontend: `useSession` handler → `addMessage({role:"transcript"})` → `updateMessage(aiPartial)`
13. `ChatTimeline` re-renders with new messages
14. Message persisted to DB (room mode only)

### Mute User Flow (Step by Step)

1. User opens app, types message in `ControlDock` input
2. Clicks "Speak Aloud" button (or send with TTS flag)
3. `sendText(text, requestTTS=true)` via WebSocket
4. Backend: `TTSService.synthesize(text, language)` → Edge TTS
5. Returns base64 MP3 → `{type:"tts_ready", audio, duration}`
6. Frontend: `base64ToAudioUrl()` creates blob URL → `new Audio(url).play()`
7. Speech is heard by conversation partner

### Authenticated Room Flow

1. User registers at `/signup` or logs in at `/login`
2. Redirected to `/lobby`
3. User A creates session → gets invite code (e.g., "ABLE-7F3")
4. User B enters code at `/lobby` → joins as opposite role
5. Both users get WebSocket tickets → connect to same room
6. Messages are persisted to DB and broadcast to all room participants
7. Sign suggestions appear as side panel cards

---

## 10. INSTALLATION AND RUNNING GUIDE

### Prerequisites
- Node.js 20+
- Python 3.11+
- An OpenRouter API key (get free at openrouter.ai)
- (Optional) Redis for multi-user scaling

### Method 1: Docker Compose (Recommended)

```bash
# 1. Clone or extract the project
cd "AI Communication Solutions for Deaf & Mute Individuals"

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Edit backend/.env — set your API key:
#    OPENROUTER_API_KEY=sk-or-v1-...

# 4. Start all services
docker compose up

# 5. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Docs (debug only): http://localhost:8000/docs
```

### Method 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set OPENROUTER_API_KEY=sk-or-v1-...

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000

# Verify: open http://localhost:8000/api/v1/health
```

#### Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Start the development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables Reference

**Backend (`backend/.env`)**
```bash
OPENROUTER_API_KEY=sk-or-v1-...     # Required
OPENROUTER_MODEL=anthropic/claude-3-haiku
STT_PROVIDER=openrouter              # openrouter | gpt-audio-mini | openai
STT_MODEL=openai/whisper-1
TTS_PROVIDER=edge                    # edge | gpt-audio-mini | elevenlabs
DATABASE_URL=sqlite+aiosqlite:///./hearme.db
JWT_SECRET_KEY=change-me-use-long-random-secret
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=false
```

**Frontend (`frontend/.env.local`)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_DEMO_VIDEO_URL=         # Optional: URL for landing page demo video
```

### Common Issues and Fixes

| Issue | Cause | Fix |
|---|---|---|
| `OPENROUTER_API_KEY is required` | Missing API key | Add key to `backend/.env` |
| WebSocket connection fails | Backend not running or wrong WS_URL | Ensure backend is on port 8000, check .env.local |
| "Audio exceeds 25MB limit" | Audio too long | Record shorter clips (<10 seconds recommended) |
| Edge TTS empty audio | Network issue or server overload | Set `TTS_EDGE_FALLBACK_TO_GPT_AUDIO=true` in .env |
| DB migration error | Schema mismatch | Run `alembic upgrade head` |
| CORS error | Frontend URL not in ALLOWED_ORIGINS | Add frontend URL to `ALLOWED_ORIGINS` in .env |
| Port 3000 busy | Another process | Change Next.js port: `npm run dev -- -p 3001` |

---

## 11. SECURITY AND VALIDATION

### Authentication Security
- **Password hashing**: SHA-256 pre-digest + bcrypt (12 rounds). The SHA-256 step solves bcrypt's 72-byte input limit for long passwords
- **JWT tokens**: HS256 algorithm, 7-day expiry for access tokens, 15-minute expiry for WebSocket tickets
- **WebSocket security**: Short-lived ticket JWT verified before connection upgrade; session membership verified against DB
- **Stateless logout**: JWT is client-discarded; server-side denylist can be added with Redis

### API Security
- **Rate limiting**: SlowAPI with IP-based limits. STT/TTS: 30/min, Auth: 20-30/min, Actions: 20/min
- **CORS**: Configurable allowed origins list, restricts cross-origin requests
- **Security headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` added to all responses
- **API docs hidden in production**: `docs_url=None` unless `DEBUG=true`

### Input Validation
- **Audio uploads**: MIME type whitelist check, 25MB size limit, minimum 100 bytes
- **Text inputs**: Pydantic schema validation on all request bodies
- **Invite codes**: Regex validation `^[A-Z0-9_]{4,32}$`
- **SQL injection**: SQLAlchemy ORM with parameterized queries — no raw SQL

### Environment Variables
- All secrets (API keys, JWT secret) in `.env` files
- `.env` and `.env.local` are listed in `.gitignore`
- Example files (`.env.example`) contain placeholder values only

### Data Privacy
- Audio data is processed in memory only, never written to disk or database
- Message content is stored in DB only for authenticated room sessions
- No third-party analytics or tracking in the codebase

### What Can Be Improved
- Add Redis-based JWT denylist for true server-side logout
- Add HTTPS enforcement (handled by deployment platform)
- Add audit logging for admin operations
- Add CSRF protection for session-modifying REST endpoints
- Implement API authentication for STT/TTS/AI endpoints (currently open)

---

## 12. TESTING AND DEBUGGING

### Existing Tests

Located in `backend/tests/`:
- `test_api_health.py` — Tests the `/health` endpoint
- `test_context_manager.py` — Tests conversation context management
- `test_language_detector.py` — Tests Arabic/English language detection

Run tests:
```bash
cd backend
python -m pytest tests/ -v
```

### Manual Testing Steps

**Test STT:**
```bash
# Using curl (replace audio.webm with actual file)
curl -X POST http://localhost:8000/api/v1/speech-to-text \
  -F "audio=@audio.webm;type=audio/webm" \
  -F "language=en"
```

**Test TTS:**
```bash
curl -X POST http://localhost:8000/api/v1/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'
```

**Test AI Response:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-response \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "task": "chat", "stream": false}'
```

**Test WebSocket:**
```bash
# Install wscat: npm install -g wscat
wscat -c "ws://localhost:8000/api/v1/ws/session/test-session-123"
# Then type: {"type":"ping"}
# Should receive: {"type":"pong"}
```

### Frontend Testing
```bash
cd frontend
npm run type-check   # TypeScript type checking
npm run lint         # ESLint checks
npm run build        # Full production build check
```

### Health Check
```bash
curl http://localhost:8000/api/v1/health
# Expected: {"status":"ok","version":"1.0.0","services":{...}}
```

---

## 13. CHALLENGES AND SOLUTIONS

| Challenge | Solution | Why This Approach |
|---|---|---|
| **Real-time audio streaming** | WebSocket binary chunks + BytesIO buffer | WebSockets provide persistent connection; buffering avoids partial audio sends |
| **Arabic TTS quality** | Microsoft Edge TTS with `ar-SA-ZariyahNeural` | Microsoft Azure has best Arabic neural voices; Edge TTS is free |
| **Arabic language detection** | Unicode range heuristic (U+0600-U+06FF) | Unicode ranges for Arabic are well-defined; heuristic is fast and reliable |
| **Multi-provider STT/TTS** | Strategy pattern with provider abstraction | Single interface with configurable implementations; easy to add providers |
| **Audio format compatibility** | FFmpeg integration via imageio-ffmpeg | Browser sends WebM/Opus; some APIs need WAV/MP3; FFmpeg handles conversion |
| **WebSocket reconnection** | Exponential backoff with 5 max retries | Handles transient network issues without flooding the server |
| **Streaming AI responses** | SSE (Server-Sent Events) via FastAPI StreamingResponse | Native support for token-by-token streaming with `text/event-stream` MIME type |
| **3D avatar without 3D model** | Procedural Three.js robot with pose interpolation | No dependency on external 3D files; always works with smooth animations |
| **Concurrent WebSocket sessions** | Per-session context registry + optional Redis pub/sub | Memory-efficient; Redis enables multi-instance horizontal scaling |
| **CORS in development** | Configurable `ALLOWED_ORIGINS` env variable | No hardcoding; works across different deployment environments |

---

## 14. LIMITATIONS

### Technical Limitations
- **STT is not truly real-time**: Whisper processes complete utterances, not streaming audio. Users must wait until they stop speaking before the transcript appears
- **No audio storage**: Audio is processed in memory and discarded. There is no replay capability
- **SQLite limitations**: SQLite is single-writer; concurrent writes under heavy load should use PostgreSQL

### Model Limitations
- **Whisper**: Can struggle with strong accents, background noise, and very fast speech. Arabic dialect recognition is less accurate than Modern Standard Arabic
- **Edge TTS**: Requires internet connection; free tier may have rate limits. No fine-grained prosody control
- **LLM (Claude 3 Haiku)**: Occasionally over-simplifies messages, changing meaning slightly. Not suitable for safety-critical communications

### UI Limitations
- **3D Avatar**: Uses simplified procedural poses, not full sign language animation. Only 8 basic poses
- **Sign language**: Only phrase-level suggestions, no sentence-level sign animation
- **Offline**: Requires internet for all AI features


---

## 15. FUTURE WORK

| Priority | Feature | Technical Approach |
|---|---|---|
| High | **Real-time streaming STT** | Integrate Deepgram or AssemblyAI for word-by-word captions |
| High | **Full sign language animation** | Motion capture dataset (PHOENIX-2014) + pose estimation model |
| High | **Mobile native app** | React Native with same backend |
| Medium | **Offline mode** | Whisper.cpp (local model) + on-device TTS |
| Medium | **Admin dashboard** | Usage analytics, user management, model performance metrics |
| Medium | **Fine-tuned LLM** | Fine-tune on deaf-friendly communication datasets |
| Medium | **Video chat** | WebRTC integration alongside text/audio channels |
| Low | **More languages** | French, Spanish, Hebrew sign language support |
| Low | **User preferences sync** | Store accessibility preferences in DB (currently client-side only) |
| Low | **Voice profiles** | Save custom TTS voice preferences per user |
| Low | **Message reactions** | Emoji reactions for non-verbal acknowledgment |

---

## 16. DOCTOR / PROFESSOR EXPECTED QUESTIONS

### Architecture Questions

**Q: What is the overall architecture of your project?**
A: The project is a monorepo with two main components: a Next.js 14 frontend (React, TypeScript, Tailwind) and a FastAPI backend (Python async). The frontend communicates with the backend via REST API for CRUD operations and WebSocket for real-time communication. The backend integrates three AI services: OpenAI Whisper for speech recognition, Microsoft Edge TTS for speech synthesis, and OpenRouter (Claude 3 Haiku) for language intelligence. Data is persisted in SQLite/PostgreSQL via SQLAlchemy. Redis is optionally used for multi-instance WebSocket broadcasting.

**Q: Why did you choose FastAPI for the backend?**
A: FastAPI is the best choice for this project for three reasons: First, it's fully async (built on Starlette/asyncio), which is essential for handling concurrent WebSocket connections and non-blocking AI API calls. Second, it has native WebSocket support. Third, Pydantic v2 integration provides automatic request/response validation. Fourth, it auto-generates OpenAPI documentation (in debug mode). It's also significantly faster than Flask or Django for async workloads.

**Q: Why WebSocket instead of REST polling?**
A: WebSocket provides a persistent bidirectional connection, which is essential for real-time communication. REST polling would introduce latency (the client would have to poll every few hundred milliseconds), waste bandwidth, and create server load. WebSocket allows the server to push transcripts, AI responses, and TTS audio instantly when ready, without the client having to ask repeatedly.

**Q: How does the frontend state management work?**
A: We use Zustand, a lightweight React state management library. A single `sessionStore` holds all runtime state: messages, live caption text, system status, language preference, accessibility settings, and the sign preview. Zustand stores are simpler than Redux (no actions/reducers/dispatch) while still providing centralized state. Components subscribe to specific store slices to avoid unnecessary re-renders.

**Q: How does authentication work in your project?**
A: We use JWT (JSON Web Tokens). On login, the server creates a JWT signed with HS256 using a secret key. The JWT contains the user ID and expiry time (7 days). The client stores it in localStorage and sends it as a Bearer token in the Authorization header. For WebSocket connections, we use a short-lived "ws ticket" JWT (15 minutes) that also contains the session ID, preventing users from connecting to sessions they don't belong to.

### Frontend Questions

**Q: Why Next.js instead of plain React?**
A: Next.js provides App Router (file-based routing), server-side rendering for the landing page (better SEO and load time), automatic code splitting, optimized image handling, and built-in deployment configuration for Vercel. For a project with both a marketing landing page and an interactive app, Next.js is the ideal choice.

**Q: What is the 3D avatar component?**
A: The 3D hologram signer is built with Three.js and React Three Fiber. It consists of a procedural robot made from Three.js geometric primitives (capsule body, sphere head, arm segments). It supports 8 sign poses (neutral, wave, yes, no, please, help, thank-you, question) with smooth interpolation using `MathUtils.damp()`. It also checks if a real GLB 3D model (`/models/signer.glb`) exists and loads that instead. If not, the procedural robot renders. The scene includes lighting, fog, and sparkle particles for visual polish.

**Q: How do you handle language switching?**
A: We have an i18n module with two translation files: `en.ts` and `ar.ts`. The `language` state in Zustand determines which translations are used. The `useTranslations(language)` hook returns the appropriate translation object. Arabic text automatically switches the UI to RTL layout using CSS `direction: rtl`. All component labels, status messages, and tooltips update without page reload.

### Database Questions

**Q: Why SQLite for development and PostgreSQL for production?**
A: SQLite requires zero setup for local development — it's a single file (`hearme.db`). PostgreSQL handles concurrent writes better, has better query performance at scale, and is supported by cloud platforms (Railway, Supabase). SQLAlchemy uses async drivers for both: `aiosqlite` for SQLite and `asyncpg` for PostgreSQL. The same ORM code works with both databases.

**Q: What is stored in the database vs. in memory?**
A: In memory: WebSocket audio buffers, conversation context (last 20 messages), WebSocket room connections. In database: users, sessions, message texts, AI metadata (emotion, intent, enhancement), sign mappings. Audio itself is never stored — it's processed in memory then discarded.

### Security Questions

**Q: How do you secure the WebSocket connection?**
A: For authenticated room sessions, clients must first call `POST /sessions/{id}/ws-ticket` to obtain a short-lived JWT (15-minute expiry). This ticket is passed as a query parameter when connecting to WebSocket. The backend verifies the JWT signature, checks the token type is "ws" (not "access"), verifies the session ID matches, and confirms the user is a participant. Invalid tokens result in WebSocket close with code 4401 (unauthorized) or 4403 (forbidden).

**Q: How do you prevent SQL injection?**
A: We use SQLAlchemy ORM exclusively. All database operations use parameterized queries with bound parameters. No raw SQL strings are constructed with user input. Alembic migrations also use the ORM metadata, not raw SQL.

### AI Model Questions

**Q: What is the most important AI component in your project?**
A: The Speech-to-Text component (Whisper) is the most critical because it is the primary communication bridge for deaf users — without accurate transcription, the core use case fails. The LLM (Claude 3 Haiku) is second in importance as it handles text simplification and AI assistance. TTS is third, primarily serving mute users.

**Q: Can the project work without an API key?**
A: Partially. The Edge TTS component works without any API key (it connects to Microsoft's free TTS service). The landing page, authentication, and basic session management work without an API key. However, Speech-to-Text (Whisper) and the LLM (Claude 3 Haiku) both require the OpenRouter API key. Without the key, the "listening" and "AI assist" features will not function.

**Q: What makes this different from Google Translate + Google STT?**
A: Three main differences: (1) Integration — all features work together seamlessly in one real-time interface, (2) Accessibility-first design — WCAG compliance, high contrast, font scaling, keyboard navigation, (3) Sign language suggestions and 3D avatar for sign language context, (4) Bilingual conversation persistence with AI classification and enhancement stored in the database.

### Performance Questions

**Q: How do you measure performance?**
A: We have a custom `MetricsCollector` class that tracks request counts, average latency, p95 latency, and error rates for each operation type (stt, tts, llm_stream, llm_ttft, http_*). Stats are exposed via the `/api/v1/metrics` endpoint and can be monitored in real time. structlog provides JSON-structured logs with correlation IDs for distributed tracing.

**Q: What is the typical latency for each AI operation?**
A: Based on the code and typical OpenRouter/Edge TTS performance:
- Whisper STT: 1,000-3,000ms for 5-second audio
- Edge TTS: 500-1,500ms for a 20-word sentence
- Claude 3 Haiku first token: 200-500ms (TTFT)
- Text classification (gpt-4o-mini): 300-600ms

---

## 17. PRESENTATION SCRIPTS

### 1-Minute Explanation
"HearMeAI is an AI communication platform for deaf and mute individuals. The app converts speech to text in real time using OpenAI Whisper, converts text to speech using Microsoft Edge TTS, and uses Claude AI to simplify or translate messages. It supports both English and Arabic, has full accessibility features, and includes a 3D sign language avatar. The backend is FastAPI with Python, the frontend is Next.js with TypeScript, and everything communicates in real time via WebSocket."

### 3-Minute Explanation
"HearMeAI solves a critical problem: over 430 million people worldwide have hearing disabilities, and millions more cannot speak. Traditional communication barriers disconnect them from everyday conversations.

Our platform has three main AI-powered communication channels. First, Speech-to-Text — using OpenAI's Whisper model, we transcribe speech in real time. A deaf user opens the app, their conversation partner speaks, and captions appear on screen within 1-2 seconds. Second, Text-to-Speech — a mute user types their message and clicks 'Speak Aloud'; Microsoft Edge TTS synthesizes it into natural speech in their preferred voice, English or Arabic. Third, AI Assistance — using Claude 3 Haiku via OpenRouter, users can simplify complex messages, request clarifications, or translate between English and Arabic.

The backend is FastAPI (Python), fully async with WebSocket support for real-time streaming. The frontend is Next.js 14 with TypeScript and a 3D hologram avatar component built in Three.js. The system uses SQLite for local development and PostgreSQL for production, with JWT authentication for secure multi-user sessions.

What makes this project unique is that it's fully accessible — WCAG 2.1 compliant, high contrast mode, font scaling, full keyboard navigation — and it's bilingual from the ground up, with full Arabic RTL support."

### 5-Minute Explanation
[Start with 3-minute version, then continue:]

"Let me walk through the system architecture in more detail. When a user speaks, the browser's MediaRecorder API captures audio in WebM format and streams it via WebSocket to our FastAPI backend. The backend buffers the audio chunks, then when recording stops, sends the complete audio to OpenRouter's Whisper endpoint. Whisper returns a transcript with detected language and timestamps. The backend then runs two AI operations in parallel: text classification using gpt-4o-mini to detect emotion and intent, and if AI assist is enabled, streaming chat completion with Claude 3 Haiku for a contextual response.

The database stores users, sessions, messages, and AI metadata. Sessions can be created with invite codes for direct connections, or users can enter a matchmaking queue where the system automatically pairs a deaf user with a mute user.

The security model uses JWT authentication with bcrypt password hashing. WebSocket connections require a short-lived JWT ticket issued per-session to prevent unauthorized access. Rate limiting via SlowAPI prevents API abuse. All secrets are environment variables.

For deployment, the frontend goes to Vercel and the backend to Railway, both connected through environment variables. Docker Compose handles local development with all services orchestrated together."

### Technical Explanation (for committee)
"The system employs a clean separation of concerns across three tiers. The presentation tier is Next.js 14 with App Router, TypeScript, Tailwind CSS, and Framer Motion. State is managed by Zustand, a lightweight flux-pattern store. Real-time communication uses a custom `SessionWebSocket` class with exponential backoff reconnection and a ping/pong keepalive.

The application tier is FastAPI with Python 3.11 async. The WebSocket session handler (`ws_session.py`) maintains per-session state: an audio buffer (bytearray), a context manager (conversation history ring buffer), and a room manager (in-memory WebSocket registry). The AI services layer uses the Strategy pattern — STTService, TTSService, and OpenRouterClient are swappable via configuration without code changes.

The data tier uses SQLAlchemy 2.0 async with either aiosqlite (development) or asyncpg (production). The schema is normalized: Users → Sessions (M:N via session_participants) → Messages (1:N) → MessageAiMetadata (1:1). Alembic manages schema migrations.

Cross-cutting concerns include: structlog for structured JSON logging with correlation IDs, SlowAPI for IP-based rate limiting, custom MetricsCollector for p95 latency tracking, and optional Redis pub/sub for horizontal WebSocket scaling."

---

## 18. FILE-BY-FILE PROJECT EXPLANATION

### Critical Backend Files

| File | Purpose | Key Functions |
|---|---|---|
| [backend/app/main.py](backend/app/main.py) | FastAPI app entry point | `lifespan()`, `request_instrumentation()`, CORS/rate-limit middleware |
| [backend/app/core/config.py](backend/app/core/config.py) | Central settings from `.env` | `Settings` class, `get_settings()` (cached singleton) |
| [backend/app/core/security.py](backend/app/core/security.py) | Auth crypto | `hash_password()`, `verify_password()`, `create_access_token()`, `create_ws_ticket()` |
| [backend/app/api/v1/endpoints/ws_session.py](backend/app/api/v1/endpoints/ws_session.py) | WebSocket hub | `websocket_session()`, `handle_audio_end()`, `handle_user_text()`, `handle_action()` |
| [backend/app/services/stt_service.py](backend/app/services/stt_service.py) | Speech-to-Text | `transcribe()`, `_transcribe_via_whisper()`, `_transcribe_via_chat()` |
| [backend/app/services/tts_service.py](backend/app/services/tts_service.py) | Text-to-Speech | `synthesize()`, `_synthesize_edge()`, `_synthesize_gpt_audio()` |
| [backend/app/services/openrouter_client.py](backend/app/services/openrouter_client.py) | LLM client | `stream_chat()`, `stream_action()`, `complete_with_model()` |
| [backend/app/services/ai_context.py](backend/app/services/ai_context.py) | AI classifier + enhancer | `classify_text()`, `enhance_text()` |
| [backend/app/services/language_detector.py](backend/app/services/language_detector.py) | Language detection | `detect_language()`, `normalize_text()`, `compute_readability_score()` |
| [backend/app/models/user.py](backend/app/models/user.py) | User ORM model | `User` class with all user fields |
| [backend/app/models/chat_session.py](backend/app/models/chat_session.py) | Session ORM models | `ChatSession`, `SessionParticipant` |
| [backend/app/models/message.py](backend/app/models/message.py) | Message ORM models | `Message`, `MessageAiMetadata` |
| [backend/app/realtime/room_manager.py](backend/app/realtime/room_manager.py) | WebSocket room registry | `connect()`, `disconnect()`, `broadcast()` |

### Critical Frontend Files

| File | Purpose | Key Elements |
|---|---|---|
| [frontend/src/app/page.tsx](frontend/src/app/page.tsx) | Landing page | Assembles all landing section components |
| [frontend/src/app/lobby/page.tsx](frontend/src/app/lobby/page.tsx) | Session management | Create/join/match session flow, onboarding |
| [frontend/src/components/chat/ChatWorkspace.tsx](frontend/src/components/chat/ChatWorkspace.tsx) | Chat orchestrator | Wires useSession, ChatTimeline, ControlDock |
| [frontend/src/lib/state/sessionStore.ts](frontend/src/lib/state/sessionStore.ts) | Global state | Zustand store: messages, status, language, a11y |
| [frontend/src/components/avatar/HologramSigner3D.tsx](frontend/src/components/avatar/HologramSigner3D.tsx) | 3D sign avatar | Three.js scene, 8 sign poses, smooth animation |
| [frontend/src/components/a11y/AccessibilityControls.tsx](frontend/src/components/a11y/AccessibilityControls.tsx) | Accessibility panel | High contrast toggle, font size selector |
| [frontend/src/lib/i18n/en.ts](frontend/src/lib/i18n/en.ts) | English translations | Full UI string dictionary |
| [frontend/src/lib/i18n/ar.ts](frontend/src/lib/i18n/ar.ts) | Arabic translations | Full Arabic UI string dictionary |
| [frontend/tailwind.config.ts](frontend/tailwind.config.ts) | Tailwind theme | Custom colors, animations, fonts |

### Configuration Files

| File | Purpose |
|---|---|
| [docker-compose.yml](docker-compose.yml) | Orchestrates frontend + backend + Redis |
| [backend/.env.example](backend/.env.example) | Template for all backend environment variables |
| [frontend/.env.example](frontend/.env.example) | Template for all frontend environment variables |
| [backend/alembic.ini](backend/alembic.ini) | Alembic migration configuration |
| [frontend/vercel.json](frontend/vercel.json) | Vercel deployment routing configuration |
| [backend/railway.toml](backend/railway.toml) | Railway deployment configuration |

---

## 19. FINAL SUMMARY

### What the Project Does
HearMeAI is a real-time AI-powered communication platform designed specifically for deaf and mute individuals. It enables two-way communication by converting speech to text (for deaf users) and text to speech (for mute users), with intelligent AI assistance for message simplification, clarification, and translation between English and Arabic.

### Main Technologies
- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS, Framer Motion, Three.js, Zustand
- **Backend**: FastAPI (Python 3.11), SQLAlchemy, Alembic, bcrypt, python-jose
- **AI**: OpenAI Whisper (STT), Microsoft Edge TTS, Anthropic Claude 3 Haiku (LLM via OpenRouter)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Infrastructure**: Docker, Vercel, Railway, Optional Redis

### Main Features
1. Real-time Speech-to-Text with live captions
2. Natural Text-to-Speech with Arabic and English voices
3. AI message simplification, clarification, and translation
4. Multi-user real-time chat sessions with invite codes
5. Matchmaking system to pair deaf and mute users
6. 3D holographic sign language avatar
7. Full bilingual support (English + Arabic with RTL)
8. WCAG 2.1 accessibility features (high contrast, font scaling, keyboard navigation)
9. JWT-based user authentication
10. Production-ready: Docker, rate limiting, structured logging, performance metrics

### AI/Model Contribution
The AI layer is the core differentiator: Whisper provides accurate multilingual transcription, Edge TTS provides natural-sounding Arabic and English voices for free, and Claude 3 Haiku enables intelligent language processing that goes beyond simple translation. The combination transforms text from being merely "readable" to being "accessible" — simplified, clear, and contextually appropriate for communication between hearing and deaf/mute individuals.

### Why the Project is Valuable
- Addresses a real accessibility gap affecting 430+ million people globally
- Fully bilingual in English and Arabic (underserved language in assistive tech)
- End-to-end implementation: not a prototype but a production-ready system
- Demonstrates integration of multiple AI APIs in a cohesive, accessible UX
- Strong engineering: async Python backend, TypeScript frontend, proper security, observability

### Best Points to Mention During Discussion
1. The multi-provider AI architecture (configurable STT/TTS/LLM with fallback chains)
2. Real-time WebSocket streaming for instant AI responses and captions
3. Arabic language support — bidirectional text, RTL layout, native Arabic voices
4. The 3D Three.js sign language avatar with procedural pose animation
5. WCAG 2.1 accessibility compliance (most AI projects ignore this)
6. Production-ready infrastructure: Docker, rate limiting, JWT auth, structured logging
7. The matchmaking system for connecting deaf and mute users automatically

---

*Documentation generated for HearMeAI v1.0.0 — April 2026*
