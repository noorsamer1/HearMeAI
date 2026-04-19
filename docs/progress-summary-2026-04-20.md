# HearMeAI Progress Summary (up to 2026-04-20)

This document records where implementation stopped so work can continue quickly tomorrow.

## Scope completed

- Landing page redesign (Phase 1) is implemented and wired in `frontend/src/app/page.tsx`.
- Auth UX redesign (Phase 2) is implemented with shared scaffold and improved validation:
  - `frontend/src/components/auth/AuthScaffold.tsx`
  - `frontend/src/app/login/page.tsx`
  - `frontend/src/app/signup/page.tsx`
- Lobby UX improvements (Phase 3) are implemented in `frontend/src/app/lobby/page.tsx`.
- Phase 4 foundation (Unified Shell + Sessions -> Chat) is implemented:
  - New sessions routes:
    - `frontend/src/app/app/sessions/page.tsx`
    - `frontend/src/app/app/sessions/[sessionId]/page.tsx`
  - Workspace component:
    - `frontend/src/components/app/SessionsWorkspacePage.tsx`
  - Legacy chat route bridge:
    - `frontend/src/app/chat/[sessionId]/page.tsx` redirects to `/app/sessions/[sessionId]`
  - Sidebar now points to sessions:
    - `frontend/src/components/app/Sidebar.tsx`

## 3D signer pipeline status

- Runtime model is present at `frontend/public/models/signer.glb`.
- Auto-fit framing fix was applied in:
  - `frontend/src/components/avatar/RealisticSignerModel.tsx`
- Raw working asset `Remy.fbx` and local animation data were kept for local workflow.

## TTS and emoji fixes completed today

- Emoji rendering in chat improved by explicit emoji font fallbacks:
  - `frontend/tailwind.config.ts`
  - `frontend/src/app/globals.css`
  - `frontend/src/components/chat/ChatBubble.tsx`
- TTS resilience improved:
  - Added Edge -> gpt-audio-mini fallback path in:
    - `backend/app/services/tts_service.py`
  - Added toggle setting:
    - `backend/app/core/config.py` (`tts_edge_fallback_to_gpt_audio`)
  - Added WAV auto-detection on client audio decoding:
    - `frontend/src/lib/api/client.ts`

## Known remaining issues

- Frontend type-check still reports pre-existing errors not introduced by this session:
  - `frontend/src/app/app/dashboard/page.tsx`
  - `frontend/src/components/chat/StatusRail.tsx`
  - `frontend/src/components/common/Toast.tsx`

## Suggested next starting point (tomorrow)

1. Continue Phase 4 polish (session list UX states and chat timeline clarity).
2. Decide final backend TTS policy for punctuation-only input:
   - Keep fallback behavior, or
   - Return user-facing `422` for non-speakable content.
3. Fill academic placeholders in landing academic section with final real data.
