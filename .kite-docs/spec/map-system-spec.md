# Tera-Story Map System Spec

> **Status**: Phase 6 / Step 6
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13

---

## 1. Purpose

The map system visualizes the world structure (4 levels: World
→ Continent → Region → Location) and lets players track their
current position. This spec defines:

- The 3-level view layout (continent / region / location)
- Location card variants and lifecycle
- Travel UX between locations
- Mobile behavior at 320/768/1280px
- Performance considerations

## 2. Current State (problem)

`pages/MapPage.tsx` is **774 LOC** with 4 useEffects, 6 useState
hooks, and renders for two route contexts (`worldId` vs
`playthroughId`). It mixes:

- Route-aware branches (`worldId` skeleton view vs `playthroughId`
  playthrough view)
- Map data fetching (via `getWorldMap`)
- Continental / region / location state
- Two view modes (`standard` vs `3level`)
- The HierarchicalMap rendering
- Both the World detail skeleton AND the Playthrough map

The current implementation inlines the 3-level hierarchy rendering
inline (~200 LOC) which makes it hard to test and modify.

## 3. Target Structure

### 3.1 Component decomposition

```
pages/MapPage.tsx (≤80 LOC: route branching + state handoff)
└── components/map/
    ├── WorldMapView.tsx        (skeleton world view for /worlds/:id)
    ├── PlaythroughMapView.tsx  (playthrough view for /playthroughs/:id)
    ├── MapViewToggle.tsx       (standard / 3-level toggle)
    ├── MapLegend.tsx           (location type + status legend)
    ├── LocationCard.tsx        (existing — already in components/map/)
    ├── RegionGroup.tsx         (existing — already in components/map/)
    ├── ContinentList.tsx       (3-level view: continent → region → location)
    ├── HierarchicalMap.tsx     (the inline ~200 LOC becomes its own file)
    └── useMapViewState.ts      (extracted hook for 4 effects + 6 states)
```

### 3.2 Route branches

`MapPage` switches on `useParams`:

```ts
const { worldId, playthroughId } = useParams();
if (worldId) return <WorldMapView worldId={worldId} />;
if (playthroughId) return <PlaythroughMapView playthroughId={playthroughId} />;
return null;
```

`WorldMapView` shows a skeleton (3 continents, 9 regions, 27
locations) without playthrough context.

`PlaythroughMapView` shows the playthrough's current location,
discovered locations, and a "Travel" button.

## 4. 3-Level View Layout

The 3-level view (default) shows:

```
┌─ Continent A ─────────────────┐
│  ├─ Region 1 ─────────────┐    │
│  │  └─ Location X          │    │
│  │  └─ Location Y          │    │
│  └─ Region 2 ─────────────┐    │
│     └─ Location Z          │    │
└────────────────────────────┘
┌─ Continent B ─────────────────┐
│  └─ ...                       │
└────────────────────────────┘
```

Each level has its own accordion:
- Continent level: collapsed by default if many
- Region level: expanded by default for the current continent
- Location level: expanded by default for the current region

Each location card uses the existing `LocationCard` primitive
from `components/map/`. Region groups use the existing `RegionGroup`
primitive.

## 5. Location Card Variants

Location cards have 4 visual states based on status:

| Status | Visual | Interaction |
|---|---|---|
| undiscovered | muted, no border accent | none (or hover-to-reveal hint) |
| known | outlined, neutral | click to expand details |
| visited | outlined, success color | click to expand details + "Travel here" |
| cleared | outlined, warning color, badge | click to expand details + "Travel here" |

Each variant uses the design-system `Badge` primitive for the
status pill, with the existing `LOCATION_STATUS_BADGES` map for
the color classes. Location type uses `LOCATION_TYPE_ICONS` and
`LOCATION_TYPE_COLORS` from the shared constants.

## 6. Travel UX

The "Travel here" button is shown on visited / cleared locations
from the current playthrough. Travel is dispatched via the
`useMap` hook's `travelToLocation` action. The button:

- Uses the design-system `Button` primitive (primary variant)
- Disables when the player is already at that location
- Shows a `<Spinner>` while the travel request is in flight
- Shows an error alert on failure (via `notifyError`)

`useMapViewState` exposes the travel state via `isTraveling` and
`travelError` so the UI can show loading / error states.

## 7. Mobile Behavior

- **320px**: each level stacks vertically. The continent list
  becomes a vertical scroll. Each region expands inline.
- **768px**: continents in 2 columns, regions stacked under their
  continent, locations in 1 column.
- **1280px**: continents in 3 columns (or 2 if 2 continents),
  regions stacked, locations in 2 columns inside each region.

The map legend lives at the bottom on mobile (sticky to the
viewport edge) and inline on desktop. Zoom controls are
positioned in the bottom-right and use the design-system
aria-labelled buttons.

## 8. Performance Considerations

The map page is the most rendering-intensive page in the app.
Performance budget:

- Initial JS bundle: ≤10 kB gzipped for MapPage (current: 5.13 kB)
- First contentful paint: < 500ms on a typical play session
- Map fetch (`getWorldMap`): cached for 5 minutes via React Query
  (or a simple `useMemo` + `useEffect` if no React Query)
- Force graph rendering: defer with `requestIdleCallback` until
  the user opens the relationship web modal
- Continent/region/location lists: virtualized if the world has
  >50 locations (rare, but possible after a long playthrough)

## 9. Accessibility Contract

- Each level (continent, region, location) is an
  `<section aria-labelledby="continent-N">` so screen readers can
  navigate by heading.
- Location cards use the existing `LocationCard` primitive, which
  is a `role="button"` with Enter/Space activation and aria-label
  including the location name and status.
- Travel buttons use the design-system `Button` primitive (Phase 1)
  with a clear label like "Travel to {locationName}".
- The "3-level" / "standard" view toggle uses `role="tablist"` with
  two `role="tab"` buttons, one of which has `aria-selected="true"`.
- The map legend is `role="region"` with `aria-label="Map legend"`.

## 10. State Management

`useMapViewState` consolidates the existing 4 useEffects and 6
useState hooks from MapPage into a single hook:

```ts
const {
  mapData,
  isLoading,
  error,
  viewMode,        // 'standard' | '3level'
  setViewMode,
  expandedContinents,
  expandedRegions,
  toggleContinent,
  toggleRegion,
  isTraveling,
  travelError,
  travelToLocation,
  refresh,
} = useMapViewState({ worldId?, playthroughId? });
```

This hook can be reused by the new `WorldMapView` and
`PlaythroughMapView` components without each having to re-implement
the same effects.

## 11. File Migration Plan

| Step | Files | Risk |
|---|---|---|
| 7 | Split MapPage into WorldMapView, PlaythroughMapView, MapViewToggle, MapLegend, ContinentList, HierarchicalMap, useMapViewState | Medium (state migration) |
| 8 | Extract map state into useMapViewState hook | Low (consolidation) |
| 9 | Color audit on remaining map files | Low (grep) |
| 10 | Use EntityCard primitive where appropriate | Low |
| 11 | Improve zoom controls | Low |
| 12 | Verification | Low |

## 12. Out of Scope

- 3D world map (deferred)
- Real-time multi-player world exploration (deferred)
- Offline mode for map data (deferred)
- Custom location editor (out of scope; world creation has its
  own tooling)
