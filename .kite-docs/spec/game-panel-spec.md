# Tera-Story Game Panel & Entity Cards Spec

> **Status**: Phase 5 / Step 1
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13

---

## 1. Purpose

The Game Panel is the primary sidebar surface where players manage
their playthrough state — character stats, inventory, abilities,
relationships, organizations, world map, and archive. This spec
defines:

- How `GamePanel.tsx` (currently 469 LOC) splits into focused tab files
- The shared `EntityCard` primitive for character/item/special-item/
  organization rendering
- Modal/drawer interactions for each tab
- Mobile behavior
- Wire-up of orphan widgets (deferred from Phase 4 step 10)

## 2. Current State (problem)

`components/game/GamePanel.tsx` is **469 LOC** and mixes 8 concerns:
- Modal shell
- Tab routing (8 tabs)
- Entity list rendering (4 types)
- Inventory rendering
- Abilities rendering
- Relationships preview
- Map preview
- Archive preview
- All rarity/status maps (Phase 1 already moved to design-system/colors)

Plus, the orphan widgets from Phase 0 (DailyCheckInModal,
EchoList, ProgressPanel, LeaderboardWidget, ShareMenu,
WhispersModal, StreakBadge, EchoIndicator) are still unmounted —
Phase 4 step 10 deferred them to Phase 5.

## 3. Target Structure

### 3.1 Component decomposition

```
components/game/
├── GamePanel.tsx           (≤120 LOC: shell + tab routing only)
├── GamePanelHeader.tsx     (tab strip with icons + labels)
├── GamePanelContent.tsx    (active-tab renderer)
└── tabs/
    ├── CharacterTab.tsx     (player stats + DynamicStatList)
    ├── CompanionsTab.tsx    (NPCs list using EntityCard primitive)
    ├── InventoryTab.tsx     (Items using ItemCard)
    ├── AbilitiesTab.tsx     (Special items using AbilityCard)
    ├── RelationshipsTab.tsx (Relationship web preview)
    ├── MapTab.tsx           (World map preview)
    ├── OrganizationsTab.tsx (Faction list using EntityCard)
    └── ArchiveTab.tsx       (Archived entities)
```

### 3.2 Shared primitives (design-system/)

- `EntityCard` (Step 3) — character/item/special-item/organization
- `ItemCard` (Step 7) — items with rarity badge + click handler
- `AbilityCard` (Step 7) — special items with category icon
- `CharacterCard` (existing, Phase 3 refactor) — wrapped on top of EntityCard

### 3.3 Tab specifications

| Tab | Icon | Content | Primary action |
|---|---|---|---|
| Character | UserRound | Player avatar + stats + DynamicStatList | View details → EntityDetailModal |
| Companions | Users | NPC list (sorted by relationship strength) | View details → EntityDetailModal |
| Inventory | Package | Items grid (rarity-sorted) | View details → EntityDetailModal |
| Abilities | Sparkles | Special items grid (category-sorted) | View details → EntityDetailModal |
| Relationships | Network | Mini relationship web (preview) | Open full → RelationshipWebModal |
| Map | MapPin | Mini world map (preview) | Open full → /playthroughs/:id/map |
| Organizations | Landmark | Faction list | View details → EntityDetailModal |
| Archive | Archive | Archived entities list | Unarchive / view details |

### 3.4 Modal / Drawer interactions

- Each tab's primary action opens via Modal primitive (Phase 3).
- Tab content itself uses `EntityCard` for visual consistency.
- MapTab is special: clicking opens the full MapPage (navigation, not modal).

## 4. EntityCard Primitive Contract

### 4.1 Variants

| Variant | Used by | Key props |
|---|---|---|
| `character` | CharacterTab + CompanionsTab | `entity: Character`, onClick → EntityDetailModal |
| `item` | InventoryTab | `entity: Item`, rarity badge, onClick → EntityDetailModal |
| `ability` | AbilitiesTab | `entity: SpecialItem`, category icon, onClick → EntityDetailModal |
| `organization` | OrganizationsTab | `entity: Organization`, status badge |

### 4.2 Visual states

- Default: bg-ink-800/50 + border-ink-700
- Hover: bg-ink-800 + border-accent-500/30 (matches Card primitive interactive)
- Focus: focus-visible:ring-2 ring-accent-500
- Selected (highlighted in RPG tab): border-accent-500 + bg-accent-500/10
- Disabled (archived): opacity-40 + cursor-not-allowed

### 4.3 Content layout (default 88px tall card)

```
┌──────────────────────────────────────────┐
│ [Avatar/Icon]  Name                  [✦] │  ← rare items show rarity icon
│                 Role / Category            │
└──────────────────────────────────────────┘
```

Tap targets ≥88×88px (full card clickable). On desktop, hover
reveals a quick-action overlay (use, equip, etc.).

## 5. RPGPanel Drawer Integration

Already migrated to Drawer primitive in Phase 4. The drawer
opens from the right side via `ReaderMobileNav` (bottom tab) or via
desktop inline trigger. Future Phase 5 enhancement: add a desktop
sidebar (always-visible on ≥1024px) that doesn't require drawer open.

## 6. Orphan Widgets Wiring (deferred from Phase 4)

Per the Phase 4 step-10 decision, wire these as EngagementSidebar
chips inside RPGPanel:

| Widget | Mode | Trigger chip |
|---|---|---|
| DailyCheckInModal | Modal (Phase 3) | 🔥 Daily streak chip |
| WhispersModal | Modal (Phase 3) | 📜 Whispers chip |
| EchoList | New modal (drawer) | 💭 Echoes chip |
| ProgressPanel | Inline (RPG > Stats tab) | (no separate chip; folded into Stats tab) |
| LeaderboardWidget | Move to /profile route | (no reader chip) |
| ShareMenu | Floating post-chapter button | Share button at chapter end |
| EchoIndicator | DELETE (redundant with EchoList) | — |
| StreakBadge | DELETE (used inside DailyCheckInModal) | — |

### 6.1 EngagementSidebar component

```tsx
<nav aria-label="Engagement" className="border-t border-ink-700 p-2">
  <EngagementChip icon="🔥" label="Streak" onClick={openDaily} />
  <EngagementChip icon="📜" label="Whispers" onClick={openWhispers} badge={count} />
  <EngagementChip icon="💭" label="Echoes" onClick={openEchoes} badge={count} />
  <EngagementChip icon="✨" label="Progress" to="/profile" />  // optional
</nav>
```

Each chip:
- `min-h-[44px]` touch target
- `aria-label` for screen readers
- Optional count badge (e.g., unread whispers count)
- Focus ring uses design-system accent

## 7. Mobile Behavior

Per the spec from Phase 4:
- ≥1024px: RPGPanel visible as right-side drawer (current behavior)
- <1024px: RPGPanel accessible via bottom-tab bar (Swords icon)
- Mobile drawer is full-height, slides in from right
- EngagementSidebar lives at bottom of RPGPanel (mobile + desktop)

## 8. Accessibility Contract

- GamePanel outer: role="region" aria-label="Game panel"
- Tab strip: role="tablist" aria-label="Game tabs"
- Each tab: role="tab" aria-selected (active) aria-controls (panel id)
- Tab panels: role="tabpanel" id="panel-<tab>"
- ArrowLeft/Right cycle tabs (ARIA tablist pattern)
- Tab activation: Enter/Space
- EntityCard: role="button" (since interactive) with aria-label
- Status indicators: aria-label="Active"/"Injured"/etc. (not color-only)

## 9. State Management

RPGPanel currently receives many props from StoryReaderPage. After
Phase 5 refactor:

- Keep the prop interface (backward compatible)
- Internally dispatch to focused tab components
- Tab state (`rpgTab`) stays in parent (RPGPanel)
- Each tab receives only the props it needs

No new state management library needed. The decomposition is pure
file-splitting; state remains in RPGPanel.

## 10. File Migration Plan

| Step | Files | Risk |
|---|---|---|
| Step 2 | Split GamePanel.tsx into 8 files | Low (pure split, no behavior change) |
| Step 3 | New design-system/EntityCard.tsx | New file |
| Step 4 | Migrate CharacterCard, CharacterTab, CompanionsTab | Medium (visual changes) |
| Step 5 | Refactor EntityDetailModal internals to use EntityCard | Medium |
| Step 6 | Already migrated in Phase 4 (Drawer) | None |
| Step 7 | ItemCard + AbilityCard primitives | New files |
| Step 8 | RelationshipWebModal canvas → tokens | Low |
| Step 9 | MapTab uses MapPage components | Medium (deduplication) |
| Step 10 | Color audit + replace | Low (grep + sed) |

## 11. Testing Contract

- Each tab component: 4-6 tests (rendering, click → EntityDetailModal,
  empty state, loading state)
- EntityCard primitive: 12+ tests (4 variants × 3 states + a11y)
- Tab keyboard nav: 6+ tests (ArrowLeft/Right cycle, Enter activates)
- axe-core scan: 0 violations on each tab + EntityCard
- Mobile drawer integration: opens, focuses inside, closes via ESC

## 12. Out of Scope (Deferred)

- Visual refresh of RPGPanel layout (Phase 7+)
- Tooltip on hover (Phase 7+)
- Drag-to-reorder tabs (Phase 7+)
- Right-click context menus (not in current UI patterns)

## 13. Phase 5 Step Plan (summary)

1. Spec (this doc) — DONE
2. Split GamePanel into focused files
3. Create EntityCard primitive
4. Migrate CharacterCard + tabs to use EntityCard
5. Refactor EntityDetailModal internals
6. RPGPanel Drawer integration (Phase 4 done; verify)
7. ItemCard + AbilityCard primitives
8. RelationshipWebModal canvas tokens
9. MapTab uses MapPage components
10. Color audit + replace (grep-driven)
11. Phase 5 verification
12. Commit + tag
