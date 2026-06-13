# Bundle Snapshot — Phase 1 Complete

> Generated: 2026-06-13
> Branch: `feat/ui-ux-upgrade`
> Phase: 1 (Foundation — Design Tokens & Primitives)

## Verification Results

| Check | Result |
|---|---|
| `npm run lint` | ✓ 0 issues |
| `npm run build` | ✓ 13.91s |
| `npm run test` (vitest) | ✓ **210 tests pass** (28 files, 0 fail) |
| `npx tsc --noEmit` | ✓ 0 errors |

## Bundle Size — Top Chunks

| Chunk | Raw | Gzipped |
|---|---|---|
| `index.js` (main app) | 384.42 kB | 122.74 kB |
| `StoryReaderPage` | 282.94 kB | 83.86 kB |
| `WorldCreatePage` | 36.44 kB | 7.30 kB |
| `MapPage` | 20.12 kB | 5.13 kB |
| `FateThreadsPage` | 18.00 kB | 5.61 kB |
| `SettingsPage` | 16.19 kB | 3.96 kB |
| `WorldDetailPage` | 15.38 kB | 4.19 kB |
| `PlaythroughPage` | 12.98 kB | 3.26 kB |
| `FriendsPage` | 11.96 kB | 3.33 kB |
| `CharacterCreatePage` | 11.11 kB | 2.86 kB |
| `GalleryPage` | 7.75 kB | 2.73 kB |
| `ChroniclePage` | 7.01 kB | 2.18 kB |
| `AchievementsPage` | 6.41 kB | 2.10 kB |
| `WorldListPage` | 6.34 kB | 2.22 kB |
| `colors` (new) | 1.50 kB | 0.48 kB |
| `DynamicStatDisplay` | 3.48 kB | 1.09 kB |
| `url` | 3.23 kB | 0.72 kB |
| `useMap` | 1.49 kB | 0.76 kB |
| `worldStore` | 1.37 kB | 0.45 kB |
| `RetryImageButton` | 1.29 kB | 0.71 kB |
| `LoginPage` | 3.44 kB | 1.34 kB |
| `RegisterPage` | 3.96 kB | 1.37 kB |

## Before vs After — Bundle Delta

| Metric | Before (Step 1 baseline) | After (Phase 1) | Delta |
|---|---|---|---|
| `index.js` raw | 383.78 kB | 384.42 kB | +0.64 kB |
| `index.js` gzipped | 122.41 kB | 122.74 kB | +0.33 kB |
| `StoryReaderPage` raw | 286.54 kB | 282.94 kB | **-3.60 kB** |
| `StoryReaderPage` gzipped | 84.59 kB | 83.86 kB | **-0.73 kB** |
| Total chunks (>1KB) | ~22 | ~24 | +2 (colors chunk + design-system module additions) |
| New design-system chunks | 0 | 1 (colors: 1.5 kB) | +1 |

Net delta: ~+0.6 kB raw / +0.3 kB gzipped on the main bundle. The
StoryReaderPage actually shrank by ~3.6 kB because Loader2 imports
were removed from 21+ files (consolidated into Spinner). The new
`colors` chunk (1.5 kB) carries the rarity/status maps.

## Test Coverage

| Phase 1 test files | Tests | Pass |
|---|---|---|
| `__tests__/design-system/Button.test.tsx` | 16 | 16 |
| `__tests__/design-system/Card.test.tsx` | 12 | 12 |
| `__tests__/design-system/Input.test.tsx` | 18 | 18 |
| `__tests__/design-system/Spinner.test.tsx` | 7 | 7 |
| `__tests__/design-system/Badge.test.tsx` | 20 | 20 |
| `__tests__/design-system/motion.test.ts` | 11 | 11 |
| `__tests__/design-system/barrel.test.ts` | 6 | 6 |
| **Phase 1 design-system subtotal** | **90** | **90** |
| Pre-existing tests (untouched) | 120 | 120 |
| **TOTAL** | **210** | **210** |

## Design System Inventory

### Modules (12)

- `cn.ts` — class composer with graceful fallback
- `colors.ts` — rarity/status/role semantic maps + helpers
- `motion.ts` — DURATION/EASING constants + helpers
- `terrain.ts` — terrain color map (used by world map)
- `Button.tsx` — primary UI primitive (5 variants × 3 sizes)
- `Card.tsx` — surface container (3 variants + 3 slots)
- `Input.tsx` — Input + Textarea with full a11y contract
- `Spinner.tsx` — loading indicator (spin + pulse variants)
- `Badge.tsx` — rarity/status label (2 shapes × 2 sizes)
- `index.ts` — barrel export

### Files Migrated (production)

- **Color unification** (7 files): EntityDetailModal, RPGPanel,
  StoryContent, GamePanel, AchievementsPage, GalleryPage,
  PlaythroughPage
- **Spinner consolidation** (21 files): App, ChapterNav, ChapterStatusOverlay,
  ChoiceCards, CombatPanel, DailyCheckInModal, PeekModal,
  AiCharacterGenerator, AiWorldGenerator, CreationOverlay, MapSelectionStep,
  RetryImageButton, CharacterCreatePage, AchievementsPage, FriendsPage,
  GalleryPage, LoginPage, RegisterPage, WorldDetailPage, FateThreadsPage,
  MapPage

### Specs Written

- `.kite-docs/spec/design-system-spec.md` — 322 lines, comprehensive
  spec covering all tokens + primitives
- `.kite-docs/spec/orphan-widgets-audit.md` — 81 lines, audit of
  9 widgets (8 confirmed orphan, 1 transitively dead)

## Phase 1 Achievement Summary

- ✓ Full token scale (colors, typography, spacing, radii, shadows,
  motion) for all 5 themes
- ✓ Broken `bg-gold` token fixed (used in 7 components)
- ✓ 7 duplicate color maps unified into single source
- ✓ 4 fragmented loading styles unified into Spinner primitive
- ✓ 5 UI primitives with 90 new tests (Button, Card, Input, Textarea,
  Spinner, Badge)
- ✓ Token-contract test enforces CSS↔TS constant parity
- ✓ `prefers-reduced-motion` global override + ARIA-respecting primitives
- ✓ Lint/build/tests/tsc all green

Ready for Phase 2: Layout & Navigation.
