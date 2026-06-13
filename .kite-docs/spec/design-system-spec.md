# Tera-Story Design System Spec

> **Status**: Phase 1 / Step 2 — Foundation
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13
> **Audience**: frontend engineers, designers, AI agents working on Tera-Story UI

---

## 1. Purpose

This document is the **single source of truth** for Tera-Story's design tokens, component primitives, and theme variants. It supersedes any ad-hoc color values, font sizes, spacing values, or animation timings scattered through the codebase. Every component in the React frontend must consume tokens defined here.

Two kinds of tokens coexist:

1. **CSS variables** (in `frontend/src/index.css`) — runtime-swappable per theme, read by Tailwind utilities via `tailwind.config.ts`
2. **TypeScript constants** (in `frontend/src/design-system/`) — for places where CSS variables can't reach (e.g. canvas/SVG fill colors in `RelationshipWebModal`, `FateThreadsPage`, hardcoded hex literals in `WorldCreatePage.tsx`)

Both layers must stay in sync. The token-contract test (Phase 1 / step 14) verifies equality.

---

## 2. Color Tokens

### 2.1 Neutral surface palette (`ink`)

The `ink-*` scale is the page background and foreground hierarchy. It is theme-aware: each of the 5 themes defines a different palette but uses the same scale names.

| Token | Role | Light | Dark | Cyberpunk | Sepia | Abyssal |
|---|---|---|---|---|---|---|
| `--ink-950` | page bg | `#F8FAFC` | `#0B1120` | `#09090b` | `#fcf4e3` | `#020617` |
| `--ink-900` | navbar/sidebar bg | `#F1F5F9` | `#0F172A` | `#18181b` | `#f3e8d2` | `#0f172a` |
| `--ink-800` | card bg | `#FFFFFF` | `#1E293B` | `#27272a` | `#f9f1e1` | `#1e293b` |
| `--ink-700` | borders (strong) | `#CBD5E1` | `#334155` | `#3f3f46` | `#d5c8ab` | `#115e59` |
| `--ink-600` | borders (subtle) | `#94A3B8` | `#475569` | `#52525b` | `#b0a184` | `#0f766e` |
| `--ink-500` | placeholder text | `#64748B` | `#64748B` | `#71717a` | `#8b7d62` | `#14b8a6` |
| `--ink-200` | main text | `#475569` | `#E2E8F0` | `#e4e4e7` | `#4a3c31` | `#ccfbf1` |
| `--ink-100` | strong text | `#1E293B` | `#F1F5F9` | `#f4f4f5` | `#2c2118` | `#f0fdfa` |

Tailwind utility: `bg-ink-800`, `text-ink-200`, `border-ink-700`, etc.

### 2.2 Warm/parchment palette (`parchment`)

Used for story prose and warm accent backgrounds.

| Token | Light | Dark | Cyberpunk | Sepia | Abyssal |
|---|---|---|---|---|---|
| `--parchment-50`  | `#0F172A` | `#FDFBF7` | `#fce7f3` | `#2c2118` | `#ccfbf1` |
| `--parchment-100` | `#F5F0E8` | `#F5F0E8` | `#fbcfe8` | `#f9f1e1` | `#134e4a` |
| `--parchment-200` | `#E2DED6` | `#E8E0D0` | `#f9a8d4` | `#d5c8ab` | `#0f766e` |
| `--parchment-900` | `#1A202C` | `#1A202C` | `#831843` | `#fcf4e3` | `#042f2e` |

### 2.3 Primary accent palette (`accent`)

The interactive accent color used for primary CTAs, focus rings, active nav states.

| Token | Light | Dark | Cyberpunk | Sepia | Abyssal |
|---|---|---|---|---|---|
| `--accent-400` | `#6366F1` | `#818CF8` | `#f472b6` | `#d97706` | `#2dd4bf` |
| `--accent-500` | `#4F46E5` | `#6366F1` | `#ec4899` | `#b45309` | `#14b8a6` |
| `--accent-600` | `#4338CA` | `#4F46E5` | `#db2777` | `#92400e` | `#0d9488` |

### 2.4 Gold palette (`gold` — NEW)

Currently the `bg-gold` utility is referenced in 7 files but **not defined** in `tailwind.config.ts`. This is a known bug (inherits no styles → invisible). Phase 1 fixes this.

| Token | Light | Dark | Cyberpunk | Sepia | Abyssal |
|---|---|---|---|---|---|
| `--gold-400` | `#FCD34D` | `#FBBF24` | `#FACC15` | `#D97706` | `#F59E0B` |
| `--gold-500` | `#F59E0B` | `#F59E0B` | `#EAB308` | `#B45309` | `#D97706` |
| `--gold-600` | `#D97706` | `#D97706` | `#CA8A04` | `#92400E` | `#B45309` |

Used by: `XPBar`, `LevelUpModal`, `DailyCheckInModal`, `DailyQuestsWidget`, `WhispersModal`, `EchoIndicator`. Tailwind utility: `bg-gold`, `text-gold-500`, etc.

### 2.5 Semantic palette (rarity, status, danger, success, info)

These are **semantic** color maps — they are the same color across themes (so a "legendary" item always looks legendary). Themes may shift lightness/saturation but the **role** is invariant.

**Rarity** (used by Items, SpecialItems):

| Rarity | Token | Color | Example |
|---|---|---|---|
| `common` | `--rarity-common` | `#9CA3AF` | gray |
| `uncommon` | `--rarity-uncommon` | `#10B981` | green |
| `rare` | `--rarity-rare` | `#3B82F6` | blue |
| `epic` | `--rarity-epic` | `#A855F7` | purple |
| `legendary` | `--rarity-legendary` | `#F59E0B` | gold |

**Status** (used by Characters):

| Status | Token | Color |
|---|---|---|
| `active` | `--status-active` | `#10B981` |
| `injured` | `--status-injured` | `#F59E0B` |
| `missing` | `--status-missing` | `#94A3B8` |
| `dead` | `--status-dead` | `#EF4444` |

**Danger / Success / Info / Warning** (toasts, banners):

| Role | Token | Color |
|---|---|---|
| `--danger` | | `#EF4444` |
| `--success` | | `#10B981` |
| `--info` | | `#3B82F6` |
| `--warning` | | `#F59E0B` |

### 2.6 Scrim (modal overlay)

Replaces `bg-black/{50,60,70}` scattered through 11+ modals. Single token, theme-aware.

| Token | Light | Dark | Cyberpunk | Sepia | Abyssal |
|---|---|---|---|---|---|
| `--scrim` | `rgb(0 0 0 / 0.6)` | `rgb(0 0 0 / 0.7)` | `rgb(0 0 0 / 0.8)` | `rgb(74 60 49 / 0.6)` | `rgb(2 6 23 / 0.7)` |

Tailwind utility: `bg-scrim`.

---

## 3. Typography

### 3.1 Font families

| Token | Family | Use |
|---|---|---|
| `--font-sans` | `'Inter', system-ui, sans-serif` | UI elements, buttons, nav, badges |
| `--font-serif` | `'Lora', Georgia, serif` | story body, prose, long-form text |
| `--font-display` | `'Playfair Display', Georgia, serif` | page titles, hero headings |

`body { font-family: var(--font-sans); }` is the default. Story content and prose-style textareas opt into `font-serif`. Display headings opt into `font-display`.

### 3.2 Type scale

| Token | Size | Line-height | Use |
|---|---|---|---|
| `--text-xs`   | 0.75rem (12px) | 1rem     | helper text, micro-labels |
| `--text-sm`   | 0.875rem (14px) | 1.25rem | secondary text, badges |
| `--text-base` | 1rem (16px)     | 1.5rem   | body text |
| `--text-lg`   | 1.125rem (18px) | 1.75rem | emphasized body |
| `--text-xl`   | 1.25rem (20px)  | 1.75rem | subheadings |
| `--text-2xl`  | 1.5rem (24px)   | 2rem     | page section titles |
| `--text-3xl`  | 1.875rem (30px) | 2.25rem  | page titles |
| `--text-4xl`  | 2.25rem (36px)  | 2.5rem   | hero |
| `--text-5xl`  | 3rem (48px)     | 1.15     | display |

### 3.3 Prose (story body)

The reader page uses:

- `font-family: var(--font-serif)` (Lora)
- `font-size: 1.0625rem` (17px)
- `line-height: 1.7`
- `max-width: 65ch` (already defined as `max-w-story`)
- Paragraph spacing: `1.25em` margin-bottom

Tailwind utilities used: `font-serif`, `text-[1.0625rem]`, `leading-[1.7]`, `max-w-story`, `mb-[1.25em]`.

---

## 4. Spacing scale

Tailwind v4 default scale (0.25rem = 4px increments) is used. Semantic aliases:

| Token | Value | Use |
|---|---|---|
| `--space-card` | `1rem` (16px) | default card padding |
| `--space-card-lg` | `1.5rem` (24px) | elevated card padding |
| `--space-section` | `3rem` (48px) | section separation |
| `--space-page-x` | `1rem` (16px) | mobile page horizontal padding |
| `--space-page-x-lg` | `1.5rem` (24px) | desktop page horizontal padding |

Tailwind utilities: `p-card`, `p-card-lg`, `gap-section`, `px-page-x`, `md:px-page-x-lg`.

---

## 5. Border radius scale

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `0.375rem` (6px) | badges, chips |
| `--radius-md` | `0.5rem` (8px) | inputs, buttons |
| `--radius-lg` | `0.75rem` (12px) | cards, modal |
| `--radius-xl` | `1rem` (16px) | elevated panels |
| `--radius-2xl` | `1.5rem` (24px) | hero panels |
| `--radius-full` | `9999px` | pills, avatars |

Tailwind utilities: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`.

---

## 6. Shadow scale

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05)` | subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | cards |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | modals, drawers |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | popovers |
| `--shadow-glow` | `0 0 20px var(--accent-500)` | focused/active glow |
| `--shadow-gold` | `0 0 16px var(--gold-500)` | progression glow |

Tailwind utilities: `shadow-md`, `shadow-lg`, `shadow-glow`, `shadow-gold`.

---

## 7. Motion tokens

### 7.1 Duration

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | `120ms` | micro-interactions (hover, press) |
| `--duration-base` | `200ms` | default transitions |
| `--duration-slow` | `320ms` | modal/drawer open/close |
| `--duration-slower` | `500ms` | page transitions |

### 7.2 Easing

| Token | Value | Use |
|---|---|---|
| `--ease-linear` | `linear` | progress indicators |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default easing |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0, 1)` | entering (fade-in, scale-in) |
| `--ease-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | exiting (fade-out) |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | playful (level-up, achievement) |

### 7.3 Reduced motion

A global `@media (prefers-reduced-motion: reduce)` rule **disables all custom animations and transitions** (`transition: none !important; animation: none !important;`). All primitives must respect this.

### 7.4 Named animations

| Name | Keyframe | Duration | Easing | Use |
|---|---|---|---|---|
| `fade-in` | opacity 0→1, translateY(8px)→0 | 200ms | decelerate | mount, toast |
| `fade-out` | opacity 1→0 | 200ms | accelerate | unmount |
| `scale-in` | scale 0.95→1, opacity 0→1 | 320ms | spring | modals, popovers |
| `slide-in-right` | translateX(100%)→0 | 320ms | standard | drawers |
| `fly-up` | translateY(20px)→0, opacity 0→1 | 1500ms | standard | daily check-in streak burst |
| `pulse-glow` | box-shadow pulse via accent | 2000ms | ease-in-out (infinite) | focused interactive |

All accessible via Tailwind: `animate-fade-in`, `animate-scale-in`, `animate-slide-in-right`, `animate-fly-up`, `animate-pulse-glow`.

---

## 8. Component primitives (Phase 1 deliverables)

| Primitive | Variants | Notes |
|---|---|---|
| `Button` | primary, secondary, ghost, danger, gold; sizes sm, md, lg; loading state | replaces 17+ duplicate primary button patterns |
| `Card` | panel, interactive, elevated | replaces 20+ duplicate card patterns |
| `Input` | text, email, password, number | with label association + error state |
| `Textarea` | with auto-resize | with label association + error state |
| `Spinner` | size sm, md, lg | replaces 4 loading styles |
| `Badge` | rarity (5), status (4), pill, square | unifies 6 rarity + 4 status maps |
| `Modal` | size sm, md, lg | uses custom focus trap (Phase 3) |
| `Drawer` | left, right | uses Modal primitive |

All primitives:
- Use design tokens (no hardcoded values)
- Respect `prefers-reduced-motion`
- Have ≥44px touch target
- Have `aria-*` attributes where applicable
- Have Vitest + Testing Library tests

---

## 9. Theme variants

The 5 themes are switchable at runtime via `useUIStore.setTheme(name)` and persisted via `tera-story-ui` localStorage key. The `App.tsx` useEffect syncs the `theme-{name}` class to `document.documentElement`.

| Theme | Class | `dark` also applied? |
|---|---|---|
| light | `.theme-light` (default) | no |
| dark | `.theme-dark` | yes |
| cyberpunk | `.theme-cyberpunk` | yes |
| sepia | `.theme-sepia` | no |
| abyssal | `.theme-abyssal` | yes |

All 5 themes MUST define every token listed in sections 2-7. The token-contract test verifies no token is missing in any theme.

---

## 10. Token contract test

A Vitest test (`frontend/src/design-system/__tests__/tokens.test.ts`) verifies:

1. Every token in sections 2-7 is defined in `index.css` for all 5 themes (no missing variables).
2. The TypeScript constants in `frontend/src/design-system/colors.ts` and `motion.ts` reference values that match the CSS variable values (stringified).
3. `bg-gold` resolves to a valid `--gold-500` value across all 5 themes.

This test is the regression net for the entire design system. Any change to tokens that breaks parity causes a red CI.

---

## 11. Anti-patterns (forbidden)

These are explicitly forbidden in code; Phase 7 audits them with grep:

- `bg-blue-500`, `text-red-400`, `text-amber-400`, `text-purple-400`, `text-emerald-400`, `text-gray-300`, `bg-stone-700`, etc. — use semantic tokens
- Hardcoded hex colors outside `design-system/colors.ts`
- `bg-black/50`, `bg-black/60`, `bg-black/70` — use `bg-scrim`
- `flex-shrink-0` — use `shrink-0` (Tailwind v4)
- `animate-spin` outside `Spinner.tsx`
- `animate-[flyUp_1.5s_ease-out]` and similar arbitrary animations — use named animations from section 7.4
- `as any`, `@ts-ignore`, `@ts-expect-error`
- Dead code, commented-out blocks
- Icon-only buttons without `aria-label`

---

## 12. Migration guide for existing code

When a component is touched:

1. Replace any hardcoded hex color or `bg-{color}-{N}` with the appropriate token.
2. Replace any `bg-black/{N}` overlay with `bg-scrim`.
3. Replace any custom `animate-[…]` with a named animation class.
4. Add `aria-label` to any icon-only button.
5. Verify touch targets ≥44px.
6. Update tests if behavior changed.

This spec is the contract. Subsequent phases consume it.
