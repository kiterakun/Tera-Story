# Frontend Knowledge Base

**Part of:** Tera-Story monorepo

## OVERVIEW
React SPA built with Vite + TailwindCSS v4 + Zustand. Consumes backend REST API. Features: AI-generated interactive storytelling, world/character management, image generation, i18n (DE/EN/VI).

## STRUCTURE
```
frontend/src/
├── components/      # Reusable UI (ErrorBoundary, Modals, Cards, etc.)
├── pages/           # Route pages (lazy-loaded via React.lazy)
├── stores/          # Zustand stores: auth, story, settings, ui, world, character
├── services/        # API client functions (axios-based)
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── i18n/            # Translation files (de.json, en.json, vi.json)
├── lib/             # Toast notification utility
└── __tests__/       # Test setup + test-utils
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new page | `pages/` | Add to `App.tsx` React.lazy imports |
| Add global state | `stores/` | Zustand with persist for settings/auth |
| Add API call | `services/` | Axios instance configured at `services/api.ts` |
| Add UI component | `components/` | Use Tailwind + Lucide icons |
| Add translation | `i18n/` | Add key to all 3 language files |
| Debug auth state | `stores/authStore.ts` | JWT cookie-based auth |
| Debug routing | `App.tsx` | Lazy-loaded route config |

## CONVENTIONS
- **Code splitting**: All pages loaded via `React.lazy()` + `<Suspense>`
- **State**: Zustand stores; persist middleware for auth and settings
- **API calls**: Centralized axios instance (`services/api.ts`) with interceptors
- **Styling**: TailwindCSS v4 utility classes; avoid custom CSS files
- **Icons**: Lucide React exclusively; no custom icon SVGs
- **Forms**: Controlled components with local state; no form library
- **Error Boundary**: `<ErrorBoundary>` wraps app root in `App.tsx`
- **i18n**: Each language has its own JSON file; use keys, not inline strings
- **TypeScript**: Strict mode; `@/` alias for `src/`; no `as any`

## ANTI-PATTERNS
- **DO NOT** use inline styles — Tailwind classes only
- **DO NOT** import backend code or share modules across package boundaries
- **DO NOT** use `flex-shrink-0` — use `shrink-0` (Tailwind v4)
- **DO NOT** use `any` type — proper types exist in `types/`
- **DO NOT** add new npm dependencies without discussion

## NOTES
- Vite proxy forwards `/api` to `http://localhost:3001` in dev
- Environment variables prefixed with `VITE_`
- Dark mode uses Tailwind `dark:` classes + Zustand persist
- Mobile-responsive with Tailwind responsive prefixes
- All page components rendered in `<Suspense fallback={...}>` in `App.tsx`
