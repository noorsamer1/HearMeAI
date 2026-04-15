# HearMeAI Frontend

Frontend application for **HearMeAI**, an AI-powered communication platform designed to support deaf and mute individuals through real-time captions, text-to-speech output, and accessibility-first conversation tools.

This repository currently contains the **frontend implementation** of the larger HearMeAI system.

## Project Vision

HearMeAI aims to make communication more inclusive by combining:

- Speech-to-Text support for deaf or hard-of-hearing users
- Text-to-Speech support for mute or non-speaking users
- AI-assisted message transformation (simplify, clarify, translate)
- Bilingual accessibility support (English and Arabic)

## Frontend Highlights

- Real-time chat workspace with live status feedback
- Live caption panel for incoming speech
- Smart AI actions on messages (simplify, clarify, translate)
- Speak-aloud flow for typed messages
- Session lobby (create room, join by invite code, matchmaking)
- Authentication screens (login/signup)
- Accessibility controls (high contrast, font scaling, keyboard-friendly UI)
- Responsive app shell with dashboard, preferences, and help routes

## Main Routes

- `/` - public landing page
- `/auth` - auth redirect
- `/login` - sign in
- `/signup` - create account
- `/lobby` - create/join/live-match sessions
- `/chat/[sessionId]` - real-time communication room
- `/app` - app shell root
- `/app/dashboard` - dashboard
- `/app/preferences` - preferences and accessibility options
- `/app/help` - help and support

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS, Framer Motion
- **State:** Zustand
- **3D/Avatar:** three.js, @react-three/fiber, @react-three/drei
- **Icons:** lucide-react
- **Realtime transport:** WebSocket client integration

## Prerequisites

- Node.js 20+
- npm 10+
- Running backend API (default: `http://localhost:8000`)

## Environment Variables

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

You can copy the sample file:

```bash
cp .env.example .env.local
```

## Local Development

```bash
npm install
npm run dev
```

App runs at:

- `http://localhost:3000`

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - lint codebase
- `npm run type-check` - run TypeScript checks

## Frontend Structure

```text
frontend/
├── public/
├── src/
│   ├── app/                # Next.js App Router pages/layouts
│   ├── components/
│   │   ├── a11y/           # Accessibility controls
│   │   ├── app/            # App shell and workspace pieces
│   │   ├── audio/          # Mic + waveform UI
│   │   ├── avatar/         # Signer/avatar components
│   │   ├── captions/       # Live caption panel
│   │   ├── chat/           # Timeline, bubbles, status
│   │   ├── common/         # Shared UI primitives
│   │   ├── landing/        # Landing page sections
│   │   └── layout/         # Navigation and control dock
│   └── lib/
│       ├── api/            # API + websocket clients
│       ├── hooks/          # Custom hooks
│       ├── i18n/           # EN/AR language content
│       └── state/          # Client state stores
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## Accessibility Commitments

- High-contrast mode support
- Font size scaling controls
- Keyboard-friendly interactions
- ARIA-aware status and feedback regions
- Bilingual UI (English/Arabic)
- RTL handling for Arabic input flows

## Typical User Flows

### Deaf / listener-focused flow

1. Enter a chat session.
2. Start listening from the mic controls.
3. Follow live captions in the side panel.
4. Review transcript messages in the timeline.
5. Use AI actions to simplify, clarify, or translate.

### Mute / speaker-focused flow

1. Enter a chat session.
2. Type a message in the control dock.
3. Send normally or use speak-aloud flow.
4. Continue conversation with real-time updates.

## Deployment Notes

- Frontend is configured for deployment on platforms like Vercel.
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your deployed backend values.

## Repository Scope

This repository currently focuses on the **frontend**. The full HearMeAI platform also includes backend and AI service layers that may be maintained in separate repositories or modules.

