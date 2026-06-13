# Tera-Story Layout & Navigation Spec

> **Status**: Phase 2 / Step 1
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13
> **Audience**: frontend engineers working on the layout shell

---

## 1. Purpose

The Layout shell is the chrome that wraps every authenticated route:
- Sticky top navbar with logo + global nav + user menu
- Mobile drawer for narrow viewports
- Theme toggle and language switcher
- Authentication-aware (hides nav when logged out)

This document specifies the target structure so we can refactor the
current 265-LOC `Layout.tsx` into focused, testable components.

## 2. Current State (problem)

- `frontend/src/components/Layout.tsx` is 265 LOC mixing 5 concerns:
  - Sticky navbar shell
  - Active-link highlighting
  - Theme toggle
  - User dropdown
  - Mobile menu
- Icon-only buttons (theme toggle, hamburger, avatar) use `title=` only — no `aria-label`
- Touch targets are 32-36px (below WCAG 44px minimum)
- `<nav>` exists but lacks an accessible name
- Dropdown menus use manual state — no outside-click, no ESC, no arrow-key nav

## 3. Target Structure

```
src/components/Layout/
├── index.ts            (re-export)
├── Layout.tsx          (≤80 LOC: thin shell)
├── Navbar.tsx          (sticky top shell, logo + global nav + right cluster)
├── NavLink.tsx         (active-link link with hover/focus/active styles)
├── UserMenu.tsx        (avatar + dropdown)
├── MobileMenu.tsx      (hamburger drawer, mobile only)
├── ThemeToggle.tsx     (light/dark cycle button)
└── LanguageSwitcher.tsx (existing component, imported here)
```

## 4. Component Contracts

### 4.1 `Layout` (shell)

```tsx
export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <>{children}</>; // Login/Register bypass Layout

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-page-x md:px-page-x-lg py-section">
        {children}
      </main>
    </div>
  );
}
```

- ≤80 LOC
- Pass-through: renders children
- Renders `<Navbar />` + `<main>` with page padding
- No business logic

### 4.2 `Navbar`

```tsx
<header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-900/80 backdrop-blur-md">
  <div className="max-w-7xl mx-auto px-page-x md:px-page-x-lg h-16 flex items-center justify-between">
    <Logo />
    <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
      <NavLink to="/worlds">{t.layout.worlds}</NavLink>
      <NavLink to="/gallery">{t.layout.gallery}</NavLink>
      <NavLink to="/achievements">{t.layout.achievements}</NavLink>
      <MoreDropdown />
    </nav>
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
      <UserMenu />
      <MobileMenu className="md:hidden" />
    </div>
  </div>
</header>
```

- Sticky top with backdrop blur (existing behavior, preserved)
- Desktop nav visible ≥768px (md breakpoint)
- Mobile menu button visible <768px
- Right cluster: lang + theme + user + (mobile on small)

### 4.3 `NavLink`

```tsx
interface NavLinkProps {
  to: string;
  children: ReactNode;
  exact?: boolean;
}

export function NavLink({ to, exact = false, children }: NavLinkProps) {
  const isActive = useMatch({ path: to, end: exact });
  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-base',
        'min-h-[44px] inline-flex items-center',
        isActive
          ? 'bg-accent-600/10 text-accent-400'
          : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800',
      )}
    >
      {children}
    </Link>
  );
}
```

- Uses React Router's `useMatch` for active detection
- `aria-current="page"` for screen readers
- min-h-44px for touch target compliance
- Smooth transition on hover

### 4.4 `ThemeToggle`

```tsx
const NEXT_THEME: Record<AppTheme, AppTheme> = {
  light: 'dark',
  dark: 'cyberpunk',
  cyberpunk: 'sepia',
  sepia: 'abyssal',
  abyssal: 'light',
};

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  const next = NEXT_THEME[theme];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch theme (current: ${theme}, next: ${next})`}
      className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-ink-200 hover:text-ink-100 hover:bg-ink-800 transition-colors duration-base"
    >
      {theme === 'light' ? <Sun /> : theme === 'dark' ? <Moon /> : <Palette />}
    </button>
  );
}
```

- Icon-only button → MUST have `aria-label`
- Replace existing `title=` attribute
- min-h-44px / min-w-44px for touch target

### 4.5 `UserMenu`

```tsx
<nav aria-label="User menu" className="relative">
  <button
    type="button"
    onClick={() => setOpen(!open)}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label={`Account menu for ${user?.username ?? 'user'}`}
    className="min-h-[44px] min-w-[44px] flex items-center gap-2 rounded-lg px-2 hover:bg-ink-800 transition-colors duration-base"
  >
    <Avatar size="sm" />
    <ChevronDown />
  </button>
  {open && (
    <div
      role="menu"
      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-ink-800 border border-ink-700 shadow-lg py-2 animate-scale-in"
      onMouseLeave={() => setOpen(false)}
    >
      <MenuItem to="/settings">Settings</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </div>
  )}
</nav>
```

- `<nav aria-label="User menu">` wraps the dropdown
- Button has `aria-haspopup="menu"` + `aria-expanded`
- Outside-click closes (ESC handler also closes)
- Animate scale-in from origin

### 4.6 `MobileMenu`

```tsx
<>
  <button
    type="button"
    onClick={() => setOpen(true)}
    aria-label="Open menu"
    aria-expanded={open}
    className="md:hidden min-h-[44px] min-w-[44px] rounded-lg p-2 text-ink-200 hover:text-ink-100 hover:bg-ink-800 transition-colors"
  >
    <Menu />
  </button>
  {open && <MobileDrawer onClose={() => setOpen(false)} />}
</>
```

- Hamburger button (md:hidden — only mobile)
- Opens Drawer (Phase 3) with focus trap
- Restore focus to hamburger on close
- Slide-in from right

### 4.7 `MobileDrawer` (Phase 3 dependency)

Will use the Modal primitive built in Phase 3. For Phase 2, fall back
to a simple `<aside>` with:
- Inline ESC handler (window keydown listener)
- Outside-click handler (overlay click)
- Focus management: trap focus inside while open, restore on close

## 5. Breakpoint Behavior

| Breakpoint | Layout |
|---|---|
| <768px (mobile) | Hamburger menu; global nav hidden; nav links + theme + lang + user inside drawer |
| ≥768px (md, tablet) | Global nav inline (Worlds, Gallery, Achievements); More dropdown for others; user menu right-aligned |
| ≥1024px (lg) | Same as md |
| ≥1280px (xl) | Same as lg (no extra padding needed) |

## 6. Accessibility Contract

| Concern | Requirement |
|---|---|
| Landmarks | `<header>`, `<nav aria-label="Primary">`, `<nav aria-label="User menu">`, `<main>` |
| Icon buttons | MUST have `aria-label`; `title=` is fallback only |
| Active link | `aria-current="page"` |
| Dropdown menu | `aria-haspopup="menu"`, `aria-expanded`, role="menu" |
| Touch targets | ≥44×44px (WCAG 2.1 AA) |
| Focus visible | `focus-visible:ring-2 ring-accent-500` |
| Keyboard | Tab cycles through interactive elements; Shift+Tab reverses; ESC closes dropdowns/menus |
| Skip link | `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>` (Phase 2 may defer) |

## 7. Token Usage

Every class in this spec references a design-system token from
Phase 1. No raw hex values, no hardcoded spacing. Specifically:
- Background: `bg-ink-{900,800,700}` (theme-aware)
- Text: `text-ink-{200,100}`
- Border: `border-ink-{700,600}`
- Accent: `bg-accent-600/10`, `text-accent-400`
- Spacing: `px-page-x`, `py-section`, `gap-1`
- Radius: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Motion: `duration-base`, `animate-scale-in`, `transition-colors`

## 8. Migration Path (Phase 2 Step Plan)

1. Extract Navbar / NavLink / UserMenu / MobileMenu / ThemeToggle
   (Step 2)
2. Add `aria-label` everywhere (Step 3)
3. Touch targets ≥44px (Step 4)
4. `<nav aria-label="...">` landmarks (Step 5)
5. Mobile menu ESC + outside-click (Step 6, ahead of Modal in Phase 3)
6. Dropdown menus ESC + arrow-key nav (Step 7)
7. Replace `bg-black/{50,60,70}` overlays with `bg-scrim` (Step 8)
8. Verify + commit (Steps 9-10)

## 9. Out of Scope (deferred)

- Active-route highlighting for /playthroughs/:id/* (use NavLink exact=true for /playthroughs only)
- Mobile bottom navigation bar (Phase 5: Game Panel may add this)
- Search bar in navbar (Phase 7 if needed)
- Notification badge on UserMenu (Phase 7)
