# Orphan Widgets Audit

> Generated: 2026-06-13 (Phase 1 / Step 13)
> Branch: `feat/ui-ux-upgrade`
> Method: `grep -r <WidgetName> src --include="*.tsx" --include="*.ts"`, excluding test files and self-definition lines

## Summary

**9 widgets investigated; 8 are confirmed orphans (defined but never rendered); 1 is in active use.**

| Widget | Definition path | Mounted by (production) | Status |
|---|---|---|---|
| `DailyQuestsWidget` | `components/daily/DailyQuestsWidget.tsx` | (none) | **ORPHAN** |
| `StreakBadge` | `components/daily/StreakBadge.tsx` | `DailyCheckInModal` (inside the modal body) | ACTIVE |
| `DailyCheckInModal` | `components/daily/DailyCheckInModal.tsx` | (none) | **ORPHAN** |
| `EchoIndicator` | `components/echoes/EchoIndicator.tsx` | (none) | **ORPHAN** |
| `EchoList` | `components/echoes/EchoList.tsx` | (none) | **ORPHAN** |
| `ProgressPanel` | `components/progression/ProgressPanel.tsx` | (none) | **ORPHAN** |
| `LeaderboardWidget` | `components/social/LeaderboardWidget.tsx` | (none) | **ORPHAN** |
| `ShareMenu` | `components/social/ShareMenu.tsx` | (none) | **ORPHAN** |
| `WhispersModal` | `components/whispers/WhispersModal.tsx` | (none) | **ORPHAN** |

## Methodology

For each widget:

```bash
grep -rln "<WidgetName>" src --include="*.tsx" --include="*.ts" \
  | grep -v "__tests__"
```

If the only hit is the widget's own definition file, it is **orphan**.
If another file imports + renders it (e.g. `<WidgetName />`), it is **active**.

StreakBadge was classified ACTIVE because `DailyCheckInModal.tsx` line ~12
imports it and renders `<StreakBadge streak={...} size="md" />`. However
`DailyCheckInModal` itself is orphan — so StreakBadge's only consumer
is also an orphan. The streak visualization never reaches the user.

## Decision (deferred to later phase)

Per the Phase 1 plan: "do not auto-delete during Phase 1 — leave
decision to a later phase."

### Three options for orphan widgets (Phase 4+)

1. **Wire them into the reader sidebar** (recommended by research).
   `StoryReaderPage` could surface `ProgressPanel`, `DailyQuestsWidget`,
   `WhispersModal` (triggered on chapter load), `EchoList`, and `EchoIndicator`.
   `ShareMenu` could attach to chapter detail. `LeaderboardWidget`
   could surface on a separate page. `DailyCheckInModal` could auto-open
   on a daily cadence.
2. **Remove them** as dead code (~500 LOC + tests).
3. **Leave as-is** for future inspiration.

### Test files that import orphan widgets (still working)

- `src/__tests__/pages/AchievementsPage.test.tsx` — references animate-spin
- `src/__tests__/pages/GalleryPage.test.tsx` — references animate-spin
- (Other test files may also import orphan widgets; tests pass today
  because the import is hoisted but no runtime error if unused.)

## Recommendation for Phase 4 (Reader)

Mount the following in the reader's right-side rail (using the Modal
primitive from Phase 3 for WhispersModal):

- `ProgressPanel` — XP/level for current playthrough
- `DailyQuestsWidget` — current daily objectives
- `WhispersModal` (button-triggered) — opens on demand
- `EchoList` (button-triggered) — opens on demand
- `ShareMenu` (button-triggered) — opens after chapter completion
- `DailyCheckInModal` (auto-triggered) — opens once per day on first
  reader visit

This brings ~500 LOC of designed features into actual use.

## Follow-up issue

Add to `.kite-docs/report/known-followups.md` (in Phase 7) once that
doc is created.
