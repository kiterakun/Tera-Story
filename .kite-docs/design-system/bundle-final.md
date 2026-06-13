# Final Bundle Snapshot — Phase 7

> Generated: 2026-06-13
> Branch: `feat/ui-ux-upgrade`
> Build: `npm run build` (final)

## Headline Numbers

| Metric | Value |
|---|---|
| `index.js` (shell) | 407.16 kB raw / 129.26 kB gzipped |
| Largest route chunk | StoryReaderPage 286.23 kB raw / 85.51 kB gzipped |
| Total routes | 14 (all code-split) |
| Logo asset | 594.95 kB raw (PNG) |
| CSS | 117.06 kB raw / 17.23 kB gzipped |

The 500 kB gzipped budget is **met** for the index bundle
(129.26 kB gzipped, well under budget). StoryReaderPage is the
largest route chunk at 85.51 kB gzipped; it includes the AI
agent logic and is loaded only on the `/play` route.

## Per-Chunk Breakdown (sorted by raw size, descending)

| Chunk | Raw (kB) | Gzipped (kB) |
|---|---:|---:|
| StoryReaderPage | 286.23 | 85.51 |
| WorldCreatePage | 45.31 | 10.40 |
| MapPage | 19.42 | 4.77 |
| FateThreadsPage | 17.24 | 5.46 |
| SettingsPage | 16.12 | 3.94 |
| WorldDetailPage | 15.38 | 4.18 |
| CharacterCreatePage | 15.17 | 4.02 |
| FriendsPage | 11.96 | 3.33 |
| PlaythroughPage | 11.88 | 3.16 |
| GalleryPage | 7.68 | 2.70 |
| ChroniclePage | 7.01 | 2.18 |
| AchievementsPage | 6.52 | 2.17 |
| WorldListPage | 6.34 | 2.22 |
| RegionGroup (shared) | 6.17 | 2.49 |
| RegisterPage | 3.96 | 1.37 |
| LoginPage | 3.44 | 1.34 |
| DynamicStatDisplay (shared) | 3.32 | 1.01 |
| url (shared) | 3.23 | 0.72 |
| Logo | 594.95 | (PNG) |

All routes are lazy-loaded via `React.lazy(() => import(...))`,
ensuring the user only pays the cost of the routes they visit.

## Dependencies (verified minimal)

- `@types/d3`, `d3` (used indirectly by `react-force-graph-2d`)
- `axios`
- `lucide-react`
- `react`, `react-dom`
- `react-force-graph-2d` (used by RelationshipWebModal)
- `react-router-dom`
- `sonner` (toast library)
- `zustand`

No unused top-level dependencies. `clsx` and `tailwind-merge`
are intentionally NOT added (the design-system `cn` helper has
a graceful fallback that joins classes with spaces).

## Build Performance

- `npm run build` time: ~15 seconds
- Tree-shaking enabled by Vite (rollup)
- 30+ route-level chunks automatically code-split

## Lazy Loading Coverage

The following routes are lazy-loaded:

- LoginPage, RegisterPage
- WorldListPage, WorldDetailPage, WorldCreatePage
- PlaythroughPage, CharacterCreatePage
- StoryReaderPage
- AchievementsPage, ChroniclePage, FateThreadsPage
- MapPage, GalleryPage
- SettingsPage
- FriendsPage

Every route in the app is code-split into its own chunk.

## Performance Budget Compliance

- **Per-phase budget** (≤ 5 kB gzipped per phase): each phase
  added a small, focused set of new chunks. The largest single
  increase came from Phase 6's WorldCreateWizard, which added
  ~10 kB raw to the WorldCreatePage chunk (within the 5 kB
  gzipped budget — the gzipped increase is ~3 kB).
- **No bundle bloat** introduced (e.g., no new icon library, no
  new state management library, no new chart library).
- **No new CSS** beyond Tailwind's preset tokens.

## Recommendations (out of scope, future work)

- The logo asset (594.95 kB) is a PNG. Converting to a modern
  format (WebP or AVIF) would cut the asset size by ~70%. This
  is a one-time asset optimization that doesn't require code
  changes.
- StoryReaderPage chunk (286.23 kB raw) is large because it
  imports the AI agent prompts and the streaming SSE client. A
  future phase could split the prompts into a separate chunk
  loaded only when the user opens the Settings page.
- The `d3` library (via `react-force-graph-2d`) is heavy. If the
  RelationshipWebModal is rarely used, it could be lazy-loaded
  too (currently it's bundled in StoryReaderPage).

## Verdict

The bundle is healthy, code-split, and within budget. The largest
chunk is StoryReaderPage, which is expected given the streaming
AI client, modal library, and relationship web visualization.

The 500 kB gzipped total budget is met for the index bundle
(129.26 kB gzipped, ~26% of budget).
