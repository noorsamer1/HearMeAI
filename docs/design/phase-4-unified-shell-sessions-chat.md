# Phase 4 - Unified Shell + Sessions -> Chat

Status: Design locked (brainstorming complete, implementation not started)
Mode: Brainstorming skill output
Scope: App shell + chat unification UX (hybrid backend plan)

---

## 1. Understanding Summary

- We are redesigning navigation and page architecture to unify dashboard/preferences/help with chat under one consistent shell.
- Entry model selected: sessions list first, then chat workspace.
- User type `both` should default to dual mode (listener + speaker affordances visible).
- Session list privacy rule is strict: role + timestamp only, no message text previews.
- This phase uses a hybrid delivery model: frontend architecture now, backend session-history enrichments later.
- Mobile-first and accessibility-first constraints remain mandatory.
- Legacy routes must continue working during migration.

---

## 2. Decisions (Accepted)

| ID | Decision | Alternatives considered | Why chosen |
|---|---|---|---|
| D1 | Phase scope = unified shell + chat (not timeline-only) | timeline-only, chat-only | User explicitly requested full shell/chat consistency |
| D2 | Entry model = sessions list -> chat workspace | chat as single item, lobby-only entry | Best practical UX for re-opening active/recent sessions |
| D3 | `both` default = dual mode | listener-first, speaker-first, remember-last | Matches inclusive use case and avoids one-sided default bias |
| D4 | Session list privacy = role + timestamp only | hide all preview, one-line text preview | Good navigation utility with strong privacy baseline |
| D5 | Delivery model = hybrid | frontend-only, backend-now | Reduces risk while keeping architecture future-ready |
| D6 | Route strategy = shell-first bridge | immediate route migration, prototype-only shell | Lowest migration risk with continuous functionality |

---

## 3. Assumptions

- Existing APIs do not yet provide full user session history for sidebar population.
- Local/session-based recent history is acceptable as a temporary source in this phase.
- Existing chat core behavior (STT/TTS/actions/signer) must remain unchanged while shell architecture is updated.
- We can keep `/lobby` as entry flow in this phase and route users into unified sessions experience after actions.
- Backend history/list endpoints will be added in a later phase without requiring major UI rewrite.

---

## 4. Open Questions (Deferred to next phase)

- Should `/lobby` become a subview of sessions or remain standalone long-term?
- Should final canonical chat path migrate from `/chat/[sessionId]` to `/app/sessions/[sessionId]`?
- Do we require server-backed session ordering/filtering before public rollout?

---

## 5. Proposed Architecture

### 5.1 High-level layout

- `UnifiedShellLayout` as the single visual frame:
  - sidebar: Dashboard / Sessions / Preferences / Help / Sign out
  - top status rail retained
  - content panel hosts selected feature view

### 5.2 Sessions-first workspace

- `SessionsSidebarPanel`:
  - rows: session id, role tag, updated timestamp, active marker
  - no message body preview
  - keyboard-navigable rows with visible focus states

- `SessionWorkspaceFrame`:
  - if session selected: renders `ChatWorkspace`
  - if no session: empty-state with CTA to create/join via lobby

- `SessionModeBadge`:
  - displays current profile mode
  - for `both`, shows dual mode badge by default

### 5.3 Route bridge

- Keep existing routes alive:
  - `/chat/[sessionId]` wrapped inside unified shell via adapter
  - `/app/*` uses same shell structure
  - `/lobby` retained for creation/join flow this phase

---

## 6. Data Flow (Phase 4)

1. User enters app via `/lobby`, `/chat/[id]`, or `/app/*`.
2. Unified shell loads profile (`deaf`/`mute`/`both`).
3. Sessions panel source composes:
   - active URL session (if present),
   - local recent sessions.
4. User selects session row -> URL/session context updates.
5. Workspace renders selected chat.
6. Recent sessions are updated after create/join/match/open events.

---

## 7. Edge Cases and Handling

- No sessions: show empty-state with clear CTA.
- Stale local session id: row marked unavailable and removable.
- Deep link into `/chat/[id]`: shell still wraps, row synthesized if missing.
- Missing role metadata: fallback role label (`Unknown role`).
- Mobile: sessions list becomes drawer, closes after selection.

---

## 8. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate headers from route bridge layering | Confusing UI | Single shell ownership point in layout tree |
| Local-only session list incomplete | Perceived inconsistency | Clear temporary behavior + backend phase follow-up |
| Privacy regression in list previews | Sensitive exposure | Enforce schema: no message text in rows |
| Mobile drawer focus traps broken | Accessibility degradation | Keyboard/focus QA checklist and explicit focus return |

---

## 9. Testing Plan

- Navigation:
  - deep-link `/chat/[id]` renders shell + active row
  - row selection updates workspace correctly
- Privacy:
  - verify no message text is rendered in session list
- Mode:
  - verify profile badges for `deaf`, `mute`, `both`
- Mobile:
  - drawer behavior, close-on-select, sticky focus safety
- Accessibility:
  - keyboard-only selection of rows
  - focus visibility for all sidebar controls
  - ARIA labels include role + timestamp context

---

## 10. Rollout Plan

1. Introduce shared shell layout.
2. Bridge-wrap chat route into shell.
3. Add sessions sidebar with local source.
4. Add workspace frame + empty-state.
5. Add `both` dual-mode default indicators.
6. Mobile and accessibility hardening.
7. Prepare phase-next API integration for server-backed history.

---

## 11. Implementation Handoff (Optional)

Ready to set up implementation if approved:

- create concrete task list by file/module,
- execute in incremental PR-sized steps,
- maintain legacy route compatibility during transition.

