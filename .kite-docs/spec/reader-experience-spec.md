# Tera-Story Reader Experience Spec

> **Status**: Phase 4 / Step 1
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13

---

## 1. Purpose

The reader is the heart of Tera-Story — every choice the player makes
flows through this surface. This spec defines the visual + interaction
contract for the reading experience: typography, choice cards,
chapter navigation, streaming render, and mobile adaptations.

Goal: an immersive, focused, accessible reading experience that
makes 1000+ word AI-generated chapters feel like a real novel.

## 2. Typography Contract

### 2.1 Story body (prose)

| Token | Value | Notes |
|---|---|---|
| Font family | Lora (font-serif token) | Italic support for entity names |
| Font size | 1.0625rem (17px) | Comfortable for long reading |
| Line height | 1.7 (already in tailwind config) | Generous spacing |
| Measure | 65ch (max-w-story) | Optimal ~66 chars/line |
| Color | text-ink-100 (body) / text-ink-200 (secondary) | Theme-aware |
| Paragraph spacing | margin-bottom 1.25em | Visual separation |

### 2.2 Drop-cap (first paragraph)

| Property | Value |
|---|---|
| Initial letter | 3-4em tall, float: left |
| Font family | font-display (Playfair Display) |
| Color | text-gold (or theme accent) |
| Margin | 0.1em 0.5em 0 0 |
| Line height | 0.9 |

Applied automatically to the first paragraph of each chapter via CSS
`:first-child::first-letter` or component-level detection.

### 2.3 Pull-quote

| Property | Value |
|---|---|
| Border-left | 3px solid border-gold |
| Padding-left | 1rem |
| Font | font-display, italic |
| Color | text-gold-400 |
| Margin | 1.5em 0 |

Triggered by Markdown-style `> quote` lines in chapter content (if AI
produces them). Optional — fallback is plain paragraph.

### 2.4 Entity markup

Character/item/special items rendered as inline buttons with:
- Rarity color (text-rare-400, text-legendary-400, etc.)
- Glow effect (drop-shadow) on hover
- Click → opens EntityDetailModal
- Keyboard focus visible (focus-visible:ring)

### 2.5 Chapter title

| Property | Value |
|---|---|
| Font | font-display |
| Size | text-3xl |
| Color | text-gold-500 |
| Spacing | margin-top 2rem, margin-bottom 1.5rem |

## 3. Choice Cards

### 3.1 Layout

- 3-4 cards stacked vertically (mobile + desktop)
- Each card is a Button (variant=secondary by default,
  variant=primary on hover/focus to draw attention)
- Full-width, min-h-[88px] for comfortable touch
- Visual hierarchy per card:
  1. **Choice title** (primary text)
  2. **Impact preview** (small text below, muted color)
  3. **Travel hint** (icon + small text if choice leads to a new location)

### 3.2 States

| State | Visual |
|---|---|
| Default | bg-ink-800 border-ink-700 |
| Hover | bg-ink-700 border-accent-500/30 |
| Focus | focus-visible:ring-2 ring-accent-500 |
| Active/pressed | scale-[0.98] (motion-standard) |
| Loading | Spinner inside button (replaces icon) |
| Selected | bg-accent-600/10 border-accent-500 |

### 3.3 A11y semantics

- Container: `role="radiogroup"` + `aria-labelledby` (chapter question)
- Each card: `role="radio"` + `aria-checked` (selected)
- Arrow keys cycle (Up/Down or Left/Right)
- Enter/Space selects
- Disabled during streaming or when already chosen

### 3.4 Animation

- Hover: transition-colors duration-base
- Active: scale-[0.98] transition-transform duration-fast
- Slide-in on chapter load: animate-fade-in (per card, staggered 50ms)

## 4. Chapter Transitions

### 4.1 Between chapters

- Outgoing chapter: animate-fade-out (200ms) — opacity 1 → 0
- Incoming chapter: animate-fade-in (200ms) — opacity 0 → 1
- Skip transition if user has prefers-reduced-motion

### 4.2 Within chapter (choice → outcome)

- Scroll to top of new chapter content (smooth scroll, auto with reduced-motion)
- Briefly highlight the new chapter title (animate-fade-in + ring)
- Choice cards slide in with stagger

## 5. Streaming Render Behavior

### 5.1 Phases

The chapter generation has 3 phases (driven by `streamPhase`):
1. **context** — "Analyzing world and story state..." spinner (uses Spinner primitive)
2. **content** — first chapter generation; text streams via SSE
3. **tools** — post-generation tools run (image gen, stat updates)

### 5.2 Visual states per phase

| Phase | Visual | Component |
|---|---|---|
| context | Spinner + "Analyzing..." | Spinner primitive |
| content (no text yet) | Spinner + "Generating..." | Spinner primitive |
| content (text streaming) | Text + blinking caret | TypewriterText or StoryContent |
| tools | Spinner + "Updating world state..." | Spinner primitive |
| failed | Red AlertTriangle + retry button | Static markup |
| retrying-tools | Spinner + "Retrying..." | Spinner primitive |

### 5.3 Loading state consolidation

Per Phase 1 audit: 4+ different loading visuals exist across the
reader. Step 9 consolidates them to use the design-system Spinner:
- Removed: animate-spin raw div, Loader2 icon, animate-pulse skeleton, animate-[flyUp]
- All replaced with `<Spinner size="..." />`

### 5.4 TypewriterText decision

Per Phase 0 audit: TypewriterText.tsx is a stub that does NOT animate.
Phase 4 step 4 decides:
- **Option A**: Implement actual character-by-character reveal using
  requestAnimationFrame + character index state, respecting
  prefers-reduced-motion (jumps to final text immediately)
- **Option B**: Delete the component entirely; rely on the streaming
  text already arriving in chunks via SSE

**Decision**: Option A — implement. The reader feels more immersive
with character-by-character reveal even at SSE-update rates, and the
component is already imported in places. Implementation:
```ts
useEffect(() => {
  if (prefersReducedMotion() || !enabled) {
    setDisplayed(text);
    return;
  }
  let i = 0;
  let cancelled = false;
  function tick() {
    if (cancelled) return;
    i += CHARS_PER_FRAME;
    setDisplayed(text.slice(0, i));
    if (i < text.length) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return () => { cancelled = true; };
}, [text, enabled]);
```

## 6. Chapter Navigation

### 6.1 ReaderHeader (top bar)

- Logo (back to dashboard) — hidden on mobile (<640px), shown on desktop
- Chapter title (current chapter name, font-display, truncated)
- Back button (← previous chapter if exists)
- Forward button (→ next chapter if exists)
- Progress bar (X of N chapters) at the bottom of the header
- Mobile: collapsed to 3 buttons (back, current, forward)

### 6.2 ChapterNav (drawer)

- List of all chapters with completion indicator (✓ for completed)
- Current chapter highlighted (bg-accent-600/10 + border-l-2 accent-500)
- Click → go to chapter
- Keyboard: Up/Down to navigate, Enter to select
- Mobile: opens via Drawer (slide from left, from Phase 3 Drawer primitive)
- Desktop: opens via Drawer (slide from left)

## 7. Mobile Adaptations

### 7.1 ReaderMobileNav (bottom bar)

- Fixed bottom bar visible <1024px (lg:hidden)
- 4 tabs: Back | Chapters | Map | RPG
- Each tab ≥44×44px
- Active tab uses text-accent-400
- Becomes Drawer trigger for Chapters (left) and RPG (right)

### 7.2 Drawer integration

- Chapters Drawer (left): uses Phase 3 Drawer primitive
- RPG Drawer (right): uses MobileDrawer (already migrated)

### 7.3 Choice card tap target

- Mobile: full-width button, min-h-[88px]
- Tap → triggers choice
- Disabled during streaming (prevents double-tap)
- Visual feedback: brief scale-[0.98] + Spinner replacing icon

## 8. Loading & Error States

### 8.1 Loading

- Spinner primitive (replaces 4 fragmented loading visuals)
- Spinner sizes: sm (inline), md (button replacement), lg (full-page)
- Color: currentColor (theme-aware)

### 8.2 Error

- ErrorBoundary (already in App.tsx) catches React render errors
- Per-chapter errors show inline retry UI (AlertTriangle + Retry button)
- Network errors show toast (Sonner) + inline error

### 8.3 Empty states

- Empty chapter list: "No chapters yet. Make a choice to start the story."
- No playthroughs: "Create a world to start reading."

## 9. Auth + Streaming Concern

### 9.1 storyApi.generateChapterStream

Current implementation uses `fetch()` directly (bypasses axios).
This means:
- ✗ Auth token NOT included (axios interceptor not run)
- ✗ 401 handling not triggered
- ✓ Works (since it's in the same origin, cookies sent)

**Fix**: refactor to use a shared fetch helper OR send the auth token
explicitly in headers. The shared helper should:
- Read the auth token from the same source as axios
- Handle 401 by triggering the same refresh logic
- Use the same base URL

Per Phase 4 step 8: refactor `useChapterGeneration.ts` to use a
shared `authedFetch` helper or send the token via header.

## 10. Orphan Widgets Wiring (per Phase 0 audit)

The 8 orphan widgets (DailyCheckInModal, EchoList, ProgressPanel,
LeaderboardWidget, ShareMenu, WhispersModal, EchoIndicator) could
be wired into the reader sidebar in Phase 4 step 10. Decision matrix:

| Widget | Wire into reader? | Rationale |
|---|---|---|
| DailyCheckInModal | YES (sidebar trigger) | Streak context |
| WhispersModal | YES (sidebar trigger) | World-building context |
| EchoList | YES (sidebar trigger) | Memory context |
| EchoIndicator | NO | Redundant with EchoList |
| ProgressPanel | YES (sidebar trigger) | XP/level context |
| LeaderboardWidget | NO | Social feature, not reader |
| ShareMenu | YES (post-chapter) | Engagement |

Sidebar layout (when ≥1024px):
- Chapter list / progress bar at top (existing)
- "Engagement" section at bottom with chips:
  - 🔥 Daily streak
  - ✨ Progress (level/XP)
  - 📜 Whispers
  - 💭 Echoes

Each chip opens the respective modal via Modal primitive from Phase 3.
Mobile (<1024px): chips live inside the RPG Drawer or as a separate
"More" menu.

## 11. Testing Contract

- Component tests: ReaderContent typography, ChoiceCards keyboard nav,
  TypewriterText character reveal, ChapterNav keyboard cycling
- Integration: full chapter walkthrough (load chapter → render content
  → show choices → select choice → next chapter)
- Visual: screenshot tests at 320/768/1280px (Phase 7)

## 12. Out of Scope (Deferred)

- iFrame-based reader (current reader is React-only)
- AI voice narration (Phase 7+)
- Reader dark/light theme override per chapter (always inherits app theme)
- Bookmarking specific paragraphs (Phase 5+)
- Highlight + notes (Phase 5+)
