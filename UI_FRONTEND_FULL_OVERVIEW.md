# HearME AI Frontend UI - Full Description

This document explains the **entire frontend UI** of HearME AI in clear, presentation-friendly language.
You can use it to explain the product to teammates, judges, or any audience.

---

## 1) Frontend Overview

HearME AI is a web interface designed to support communication between:

- Deaf or hard-of-hearing users (Speech to Text support)
- Mute or non-speaking users (Text to Speech support)
- Mixed users who need both modes in one session

The frontend is built to feel modern, calm, and accessible:

- Dark, high-contrast design with clear visual hierarchy
- Real-time chat workspace
- Live caption area for incoming spoken language
- Quick action buttons to simplify, clarify, translate, and speak messages
- Language toggle (English/Arabic) and accessibility controls

The UI is organized into clear routes:

- Landing/public marketing experience
- Authentication flow (sign in/sign up)
- Lobby for creating or joining sessions
- Real-time chat room
- Main app shell with dashboard/preferences/help

---

## 2) Main UI Style and Design Language

### Visual identity

- Futuristic dark theme (slate/indigo/violet tones)
- Rounded cards, soft glow effects, glassmorphism elements
- Animated gradients and micro-interactions for live feeling
- Consistent icon usage (microphone, captions, AI assistant, status signals)

### UX principles visible in the UI

- **Action-first controls**: mic, type, send, speak are always near the user input
- **Low cognitive load**: empty states and labels guide first-time users
- **Accessibility-first**: contrast toggle, font-size controls, keyboard-friendly controls
- **Real-time feedback**: live indicators for listening, processing, and speaking

---

## 3) Public Landing Experience (`/`)

The landing page is designed to quickly communicate value and trust.

### 3.1 Top navigation bar

- Brand/logo: HearME AI
- Section shortcuts: Features, Technology, Accessibility, About
- CTA buttons:
  - Sign In (`/auth` -> redirects to login)
  - Start Demo (`/app`)

### 3.2 Hero section

- Main message: real-time inclusive communication
- Strong headline + supporting subtitle
- Dual CTAs:
  - Start Communicating (opens app)
  - Learn More (scrolls to About)

### 3.3 Animated preview section

- Simulated chat interface mockup
- Shows a visual story of conversation flow:
  - AI response bubble
  - User reply bubble
  - Typing/live response effect
  - Fake input dock with mic and send icons

### 3.4 Informational sections

- **Core Features**: instant captions, natural voice synthesis, smart AI assistance
- **Technology**: latency/security messaging and animated visual element
- **Accessibility**: WCAG-focused claims and accessibility badges
- **Mission/About**: inclusion mission + Join Platform CTA (`/auth`)

---

## 4) Authentication UI

### 4.1 Auth redirect (`/auth`)

- This route redirects directly to `/login`.

### 4.2 Login page (`/login`)

- Card layout with:
  - Email
  - Password
  - Sign in button
- Error message area for failed login
- Secondary links:
  - Create account (`/signup`)
  - Back to demo chat (`/`)

### 4.3 Signup page (`/signup`)

- Account creation form fields:
  - Display name
  - User type (deaf / mute / both)
  - Email
  - Password
- Submit button with loading state
- Error area for registration failures
- Link back to login page

After successful login/signup, users are sent to the lobby.

---

## 5) Lobby UI (`/lobby`)

The lobby is the staging area before entering a live room.

### 5.1 Header area

- User identity display (signed in user + profile type)
- Quick links:
  - Demo chat
  - Log out

### 5.2 New room card

- Create a direct session
- If invite code exists, show:
  - Invite code (large, easy to copy)
  - Copy code button
  - Open chat room button

### 5.3 Join with code card

- Input for invite code
- Role selector:
  - Join as deaf/listener
  - Join as mute/speaker
- Join session action button

### 5.4 Matchmaking card

- Queue side selector:
  - Listener side (deaf/captions/STT)
  - Speaker side (mute/text/TTS)
- Find a partner action
- Auto-polling behavior until a partner is found
- Status messaging to keep the user informed while waiting

---

## 6) Real-Time Chat Room UI (`/chat/[sessionId]`)

This is the core interaction screen.

### 6.1 Room top strip

- Displays shortened room ID
- Displays invite code when available
- Copy invite button
- Link back to lobby

### 6.2 Main workspace composition

The chat room embeds `ChatWorkspace`, which contains:

- Header bar (logo, connection status, system status, language toggle, accessibility panel)
- Main split area:
  - Left/main column: conversation timeline
  - Right column (desktop): live caption + hologram signer panel
- Bottom dock: mic + text input + quick actions
- Toast notifications for user feedback

---

## 7) Core Chat Workspace Details

### 7.1 App header controls

- **StatusRail**:
  - Connection state (`connected` / `disconnected`)
  - System state (`idle`, `listening`, `processing`, `speaking`)
  - Animated icon/color changes per state
- **Language toggle**:
  - Switches between English and Arabic UI text
  - Supports RTL behavior for Arabic input direction
- **Accessibility controls trigger**:
  - Opens a compact floating panel

### 7.2 Conversation timeline

- Empty state with guidance message and icon
- Auto-scroll to latest messages
- Live AI streaming preview while response is incoming
- Message roles are visually distinct:
  - User
  - Transcript
  - Assistant
  - Action result (simplify/clarify/translate output)

### 7.3 Chat bubbles and actions

Each message can include:

- Role marker
- Timestamp
- Confidence badge for transcript messages
- Detected language badge
- Peer badge when message came from room partner
- Action badge for transformed messages

Hover/action toolbar provides:

- Copy message
- Speak this message (TTS playback)
- AI actions (for non-user messages):
  - Simplify
  - Clarify
  - Translate

### 7.4 Live caption side panel

- Header with live state indicator
- Current live caption text area (with cursor pulse effect)
- Listening indicators during active microphone capture
- Empty animated waveform state when nothing is captured yet
- Embedded hologram signer section below captions

### 7.5 Hologram signer preview

- 3D hologram-style signer viewport
- Phrase-to-pose sequence mapping for known phrases (e.g., hello, thank you, help)
- Step progression indicators for pose sequence
- Closable preview panel behavior

### 7.6 Bottom control dock

- **Mic button**
  - Start/stop recording
  - Recording pulse rings
  - Live waveform visualizer
  - Permission/error handling
- **Text input**
  - Auto-resizing textarea
  - Enter to send, Shift+Enter for newline
- **Quick actions**
  - Speak Aloud (send with TTS intent)
  - Clear chat
  - Keyboard shortcut hints

---

## 8) App Shell Screens (`/app/*`)

Inside the app shell there is a sidebar-based navigation system.

### 8.1 Sidebar behavior

- Desktop:
  - Expand/collapse sidebar
  - Animated active route highlighting
  - Tooltips in collapsed mode
- Mobile:
  - Drawer menu with overlay
  - Open/close controls

Sidebar links:

- Dashboard (`/app/dashboard`)
- Live Sessions (`/app`)
- Preferences (`/app/preferences`)
- Help & Support (`/app/help`)
- Sign out shortcut

### 8.2 Dashboard screen

- Presentational metrics cards (sessions, synthesized words, saved transcripts)
- Animated telemetry placeholder panel for future chart data

### 8.3 Preferences screen

- UI controls for:
  - High contrast mode toggle
  - Reduce animation toggle
  - Primary language selector

### 8.4 Help screen

- Support cards for:
  - Documentation
  - Contact accessibility team

---

## 9) Accessibility and Inclusion Features in UI

The frontend demonstrates accessibility-aware behavior through:

- High-contrast mode option
- Font-size scaling options (normal, large, x-large)
- Keyboard-operable controls
- ARIA attributes on status/log regions
- Visible focus handling on interactive controls
- Bilingual interface support (EN/AR)
- RTL text direction handling in input when Arabic is selected

---

## 10) End-to-End User Experience Summary

### Flow A - Deaf/listener focused

1. Open app or join a room
2. Start microphone listening
3. Watch live captions in side panel
4. Confirm transcripts in timeline
5. Use AI actions to simplify/clarify/translate
6. Respond by text or use spoken playback

### Flow B - Mute/speaker focused

1. Type message in dock input
2. Send as normal message or Speak Aloud
3. Listen to generated TTS playback
4. Continue real-time conversation with partner

### Flow C - Authenticated room-based usage

1. Sign in or create account
2. Enter lobby
3. Create room, join by code, or use matchmaking
4. Open room and communicate with real-time AI support

---

## 11) Talking Points for Presentation

If you want a short explanation to tell people quickly, you can use:

> "HearME AI is a real-time communication frontend for deaf and mute users.  
> It combines live captions, smart AI message assistance, text-to-speech output, and bilingual accessibility controls in one interface.  
> Users can authenticate, create or join rooms, and communicate smoothly through a modern, inclusive chat workspace."

---

## 12) Notes About Current UI State

- Some pages are currently more demo/presentation oriented (especially dashboard cards and animated previews).
- Core real-time interaction components are already structured clearly for production iteration.
- The UI architecture is modular, making it easy to expand:
  - More languages
  - Better analytics
  - Richer signer/avatar mapping
  - Deeper accessibility personalization

