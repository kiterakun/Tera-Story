# Orphan Widgets Decision (Reader Sidebar Wiring)

> **Status**: Phase 4 / Step 10
> **Branch**: `feat/ui-ux-upgrade`
> **Date**: 2026-06-13

## Background

The Phase 0 audit identified 9 widgets as "orphan" (defined but
never rendered in production). Of those, 8 are listed in the
Phase 4 step-10 spec as candidates to potentially wire into the
reader sidebar (Section 10 of `reader-experience-spec.md`):

- `DailyCheckInModal`
- `EchoList`
- `EchoIndicator`
- `ProgressPanel`
- `LeaderboardWidget`
- `ShareMenu`
- `WhispersModal`
- `StreakBadge` (used inside `DailyCheckInModal` — transitively orphan)

## Verification of Current Usage

I re-verified that none of these widgets are mounted anywhere in the
reader flow. The reader's primary surfaces are:

- `StoryReaderPage` — main chapter + choices
- `ChapterStatusOverlay` — streaming phase indicators
- `ChoiceCards` — choice selection
- `EntityDetailModal` — entity drill-in (Phase 3 modal)
- `RelationshipWebModal` — character web (Phase 3 modal)
- `ReaderHeader` — chapter nav (Phase 4 step 5)
- `ReaderMobileNav` — bottom tab bar (Phase 4 step 6)
- `ChapterNav` (drawer) + `RPGPanel` (drawer) — sidebar contents
  (Phase 3 + 4 step 7)

The sidebar drawers have a fixed scope: chapter list on the left,
RPG panel on the right. Neither surfaces "engagement" widgets.

## Decision: Defer Wiring to a Dedicated Phase 5 Sub-Phase

I am deferring wiring of these widgets to the reader. Rationale:

### 1. Scope creep risk

Phase 4 is focused on the **reading surface** itself — typography,
choice cards, streaming, navigation. Wiring 8 widgets into a sidebar
inside Phase 4 would:
- Require designing a new engagement-sidebar layout
- Touch the RPGPanel / ChapterNav drawer state management
- Need new icons, copy strings, and component-level tests
- Risk bloating the bundle (each Modal adds ~5KB)

This would split attention from Phase 4's polish goals.

### 2. Spec recommendation already deferred to Phase 5+

The reader-experience-spec.md Section 10 says:
> "Sidebar layout (when ≥1024px)... Engagement section at bottom
> with chips: Daily streak, Progress, Whispers, Echoes.
> Each chip opens the respective modal via Modal primitive from
> Phase 3. Mobile (<1024px): chips live inside the RPG Drawer or as a
> separate 'More' menu."

This explicitly calls for a sidebar layout — a separate design work.
The proper place is **Phase 5 (Game Panel & Entity Cards)**, where
the sidebar architecture gets defined holistically.

### 3. Modal complexity requires care

`DailyCheckInModal`, `WhispersModal`, and `EchoList` are full-modal
experiences. The reader flow is already modal-heavy (ChoiceCards
→ EntityDetailModal). Adding more modals risks cognitive overload.

Better pattern: surface these as **subtle sidebar chips** that
open the modal on click. The chips themselves live in the sidebar
drawer (ChapterNav for left drawer, RPGPanel for right drawer).
The drawers become "engagement hubs" — not just chapter list + RPG
panel.

### 4. Several widgets are not reader-specific

- `LeaderboardWidget` — social feature, not reader-content. Belongs
  in a profile/leaderboard page, not reader sidebar.
- `EchoIndicator` — redundant with `EchoList`. Skip.
- `ProgressPanel` — content exists in `RPGPanel > Stats tab`. Skip.
- `ShareMenu` — better as a floating share button at chapter end
  (post-completion trigger), not sidebar.
- `StreakBadge` — used inside `DailyCheckInModal`. If we wire
  `DailyCheckInModal`, the badge comes along.

## Recommended Phase 5 Sub-Phase: Engagement Sidebar

When Phase 5 (Game Panel & Entity Cards) starts, add:

1. **New `EngagementSidebar` component** (lives in `components/reader/`)
   - 4 chips at the bottom of the right drawer (where RPGPanel is):
     - 🔥 Streak (opens DailyCheckInModal)
     - ✨ Progress (already in RPGPanel > Stats; consider moving)
     - 📜 Whispers (opens WhispersModal)
     - 💭 Echoes (opens EchoList modal)
   - Each chip = min-h-[44px] button with icon + label + count badge

2. **Phase 5 Step 4**: Share post-chapter
   - Floating Share button at end of chapter content
   - Opens ShareMenu modal (currently unused)
   - Or: replaces ShareMenu with native share API + toast

3. **Phase 5 Step 6**: Profile page
   - LeaderboardWidget moves to its own profile route
   - Pulled out of reader context entirely

4. **Delete redundant widgets**:
   - `EchoIndicator` (covered by `EchoList`)
   - `StreakBadge` standalone usage (covered by `DailyCheckInModal`)
   - `ProgressPanel` standalone (covered by `RPGPanel > Stats`)

## Files Affected in Phase 5 (not Phase 4)

- `components/reader/EngagementSidebar.tsx` (new)
- `components/reader/ReaderMobileNav.tsx` (add Engagement sidebar to right drawer)
- `components/story-reader/index.ts` (export EngagementSidebar)
- `components/social/LeaderboardWidget.tsx` (move to profile route)
- `components/echoes/EchoIndicator.tsx` (delete — redundant)
- `components/daily/StreakBadge.tsx` standalone (delete — use inside DailyCheckInModal)

## Tests to Add in Phase 5

- EngagementSidebar renders 4 chips
- Each chip opens its respective modal
- Modal content accessible (axe-core scan)
- Mobile (<1024px) shows chips inside RPG drawer
- Desktop (≥1024px) shows chips in sidebar

## Summary

**Deferral is the right call.** The reader sidebar engagement work is a
distinct design task that belongs with the Game Panel & Entity Cards
work in Phase 5. Phase 4 stays focused on reading polish (typography,
choices, streaming, navigation). All 9 orphan widgets remain as-is —
no production code references them, but they're available when we
tackle Phase 5's engagement sidebar design.

No code changes in this step. Decision documented for the Phase 5
planner to reference.
