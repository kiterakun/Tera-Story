# Tera-Story Engagement, Social & Polish Spec

> **Status**: Phase 7 / Step 1
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13

---

## 1. Purpose

Phase 7 is the final polish phase of the UI/UX upgrade. After
Phases 1–6 (foundation, layout, a11y, reader, game panel, world
creation + map), the remaining surfaces are the engagement and
social features: daily check-in, quests, streak, friends,
leaderboard, share, gallery, achievements, chronicle, and fate
threads. This spec defines the consistency targets and
implementation plan for those surfaces.

## 2. Engagement Surfaces

### 2.1 Daily Check-in Modal

Currently `DailyCheckInModal.tsx` exists but is not mounted (per
the orphan-widgets decision in Phase 4 step 10). The Phase 7
plan is to **leave it unmounted** and use the existing
notification patterns (toast) for daily reminders instead. If
the user later wants to surface it, mount it via the
EngagementSidebar (deferred).

**Implementation**: skip. Document the decision here.

### 2.2 Daily Quests Widget

Same as 2.1 — the orphan-widgets decision covers it. No
implementation in this phase.

### 2.3 Streak Badge

Same as 2.1 — no implementation.

## 3. Progression Surfaces

### 3.1 Level Up Modal

The `progression/LevelUpModal.tsx` should be audited for:
- Design-system Modal primitive (already done in Phase 3)
- Motion tokens for the level-up animation (add to
  prefers-reduced-motion)
- Replace any raw `bg-gold` with the design-system gold token

### 3.2 Progress Panel + XP Bar

`progression/ProgressPanel.tsx` and any `XPBar` components
should be audited for:
- Design-system Card + Spinner for loading states
- ProgressBar uses aria-valuenow / aria-valuemin / aria-valuemax
- `prefers-reduced-motion` for fill animation
- No raw `bg-gold` literals

## 4. Social Surfaces

### 4.1 Leaderboard Widget

`social/LeaderboardWidget.tsx` — currently not mounted. Phase 7
polish if it's used; otherwise document the deferred status.

### 4.2 Friends Page

`pages/FriendsPage.tsx`:
- Replace raw `bg-black/X` with `bg-scrim` token
- Use design-system `Card` for each friend card
- Use design-system `Badge` for online/offline status
- Use design-system `Button` for friend actions

### 4.3 Share Menu

`social/ShareMenu.tsx`:
- Use design-system `Modal` for the share dialog
- Include a live preview of the share text
- Add copy-to-clipboard button with feedback toast

## 5. Content Pages

### 5.1 Gallery Page

`pages/GalleryPage.tsx`:
- Use design-system `Card` for each gallery item
- Use design-system `Spinner` for loading
- Use design-system `Modal` for the detail view
- Empty state uses `text-center` with `ink-200/40` icons

### 5.2 Achievements Page

`pages/AchievementsPage.tsx`:
- Use design-system `Card` for each achievement
- Use design-system `Badge` for the achievement tier
- Progress bar uses `role=progressbar` with aria-valuenow

### 5.3 Chronicle Page

`pages/ChroniclePage.tsx`:
- Use design-system `Card` for each story card
- Use design-system `Spinner` for loading
- Use design-system `Modal` for the detail view

### 5.4 Fate Threads Page

Already polished in Phase 6 (zoom controls ≥44px, FATE_THREAD_COLORS
tokens, no raw hex). No further work in Phase 7.

## 6. Auth Pages

### 6.1 Login / Register / Character Create

- Consistent error banners using the design-system pattern
  (red border + role=alert + retry button)
- Loading states via design-system `Spinner`
- Form fields use design-system `Input`
- Touch targets ≥44px

## 7. Settings + Privacy

### 7.1 Settings Page

`pages/SettingsPage.tsx`:
- Form fields use design-system `Input`
- Theme picker uses design-system `Badge` or `Card` for preview
- Save button uses design-system `Button`

### 7.2 Privacy Settings

- Use design-system `Input` for all text fields
- Use design-system `Card` for grouped options
- Consistent error banners

## 8. Performance Pass

- Audit bundle size via `npm run build`
- Lazy-load heavy components via `React.lazy` (MapPage,
  FateThreadsPage, Achievement graph)
- Remove unused dependencies (audit `package.json`)
- Ensure code splitting is enforced for all routes

## 9. Final A11y Pass

- Run axe-core smoke test across all routes
- Manual keyboard walkthrough of every page
- Fix any remaining violations
- Record report in `.kite-docs/report/a11y-final.md`

## 10. Anti-pattern Audit

- `grep -r "as any" frontend/src` should return no results
- `grep -r "@ts-ignore" frontend/src` should return no results
- `grep -r "@ts-expect-error" frontend/src` should return no results
- `grep -r "flex-shrink-0" frontend/src` should return no results
  (use `shrink-0`)
- `grep -rE "#[0-9a-fA-F]{3,8}" frontend/src` should only return
  design-system/colors.ts, terrain.ts, etc.
- `grep -r "bg-black/" frontend/src` should return no results
  (use `bg-scrim`)
- `grep -r "animate-spin" frontend/src/components` should return no
  raw `<div className="animate-spin">` (use the design-system
  Spinner)

## 11. i18n Parity

- Diff key sets in `frontend/src/i18n/en/*.ts` vs
  `frontend/src/i18n/vi/*.ts`
- Fix any new strings added without Vietnamese translation

## 12. Backend Test Verification

- Run `cd backend && npm test` to confirm 579 backend tests still
  pass
- Some frontend service code (e.g., `api.ts`) is imported by
  backend tests, so any breaking change would surface there

## 13. Final Report

`.kite-docs/report/final-report.md` will cover:
- Executive summary
- Before/after screenshots at all breakpoints (320/768/1280px)
- Accessibility audit results
- Bundle size before/after
- List of design-system primitives
- List of migrated modals
- List of bug fixes (bg-gold, TypewriterText, storyApi auth
  bypass, orphan widgets)
- Known follow-ups
- Migration guide for future developers

## 14. File Migration Plan

The Phase 7 work is largely polish + verification, not a big-bang
refactor. Most files will receive small targeted changes:

| Step | Files | Risk |
|---|---|---|
| 2 | Daily engagement (skip) | None |
| 3 | Progression components | Low (motion + bg-gold cleanup) |
| 4 | Social surfaces (Friends, Share) | Low (Card + Button swap) |
| 5 | Gallery, Achievements, Chronicle | Low (Card + Spinner + Modal) |
| 6 | Auth pages | Low (form polish) |
| 7 | Settings + Privacy | Low (Input + theme picker) |
| 8 | Performance | Medium (lazy load) |
| 9 | A11y | Low (existing audits) |
| 10 | Anti-pattern audit | None |
| 11 | i18n parity | Low (fix any new keys) |
| 12 | Backend tests | None |
| 13 | Final report | None |
| 14 | Commit + push | None |

## 15. Out of Scope (deferred to future work)

- Dark mode / cyberpunk / sepia / abyssal theme switcher UI
- Profile page for the current user
- Real-time notifications (web sockets)
- Mobile native app wrapper
