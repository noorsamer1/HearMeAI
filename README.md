# AI Communication Assistant for Deaf & Mute Individuals

A production-ready, accessibility-first real-time web application enabling seamless communication between deaf and mute individuals using AI-powered Speech-to-Text, Text-to-Speech, and intelligent language understanding.

## Features

- **Speech → Text**: Real-time transcription via OpenAI Whisper API with confidence tinting and live caption panel
- **Text → Speech**: Natural voice output via Edge TTS with Arabic and English voices
- **AI Assist**: Sentence simplification, clarification, and smart responses via OpenRouter
- **Accessibility-first**: WCAG-compliant, high-contrast mode, font scaling, keyboard navigation, RTL Arabic support
- **Real-time streaming**: WebSocket-based bi-directional communication with SSE fallback
- **Language support**: English and Arabic with auto-detection

## Architecture

```
frontend/   → Next.js 14 (App Router, TypeScript, Tailwind, Framer Motion)
backend/    → FastAPI (Python, async, WebSocket, Pydantic v2)
```

**AI Stack**
- STT: OpenAI Whisper API
- TTS: Microsoft Edge TTS (edge-tts)
- LLM: OpenRouter (Claude 3 Haiku / configurable)

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- OpenAI API key (for Whisper STT)
- OpenRouter API key (for LLM)

### Using Docker Compose (recommended)

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit with your API keys, then:
docker compose up
```

Open http://localhost:3000

### Manual Setup

**Backend**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Add your API keys
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local    # Add backend URL
npm run dev
```

Open http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Required |
|---|---|---|
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `OPENAI_API_KEY` | OpenAI key for Whisper STT | Yes |
| `OPENROUTER_MODEL` | LLM model (default: `anthropic/claude-3-haiku`) | No |
| `TTS_PROVIDER` | TTS engine: `edge` or `elevenlabs` | No |
| `REDIS_URL` | Redis URL for caching | No |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | Yes |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL |

## User Flows

### Deaf User Flow (Speech → Text)
1. Open app → clean chat workspace appears
2. Another person speaks near the microphone
3. Click "Listen" — live captions stream in real time
4. Finalized transcript enters the chat timeline as a message
5. Tap **Simplify** on any message for clearer language
6. Type a response; tap **Speak** to hear it via TTS

### Mute User Flow (Text → Speech)
1. Open app → chat workspace appears
2. Type your message in the input field
3. Tap **Send as Voice** — Edge TTS plays the message aloud
4. Use **AI Assist** to rephrase before speaking
5. View conversation history in the chat timeline

## Accessibility

- WCAG 2.1 AA/AAA contrast support
- High-contrast mode toggle (bottom-right)
- Font size scaling (Normal / Large / X-Large)
- Keyboard navigation with visible focus rings
- ARIA live regions for all status changes
- No reliance on audio cues for critical UI events
- RTL layout for Arabic

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/
│   │   │   ├── a11y/             # Accessibility controls
│   │   │   ├── audio/            # Mic button, waveform, player
│   │   │   ├── captions/         # Live transcript panel
│   │   │   ├── chat/             # Chat bubbles, timeline, status
│   │   │   ├── common/           # Buttons, badges, toasts
│   │   │   └── layout/           # App layout, control dock
│   │   ├── lib/
│   │   │   ├── api/              # REST + WebSocket clients
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── i18n/             # EN/AR translations
│   │   │   └── state/            # Zustand session store
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/     # Route handlers
│   │   ├── core/                 # Config, logging, rate limit
│   │   ├── schemas/              # Pydantic DTOs
│   │   └── services/             # AI service adapters
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## Deployment

- **Frontend**: Deploy `frontend/` to [Vercel](https://vercel.com)
- **Backend**: Deploy `backend/` to [Railway](https://railway.app) or [Render](https://render.com)
- Set environment variables in each platform's dashboard

## License

MIT
