# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-11
**Branch:** main

## OVERVIEW
Tera-Story is an AI-powered interactive storytelling platform. Backend (Express + MongoDB/Mongoose + TypeScript) serves a REST API consumed by the React frontend (Vite + TailwindCSS + Zustand). AI agents (writer, image, context, support) generate narrative content via the Vercel AI SDK.

## STRUCTURE
```
Tera-Story/
├── backend/           # Express REST API server
│   └── src/
│       ├── agents/    # AI agents (writer, image, context, support)
│       ├── config/    # Database & app configuration
│       ├── middleware/ # Auth, error handling, uploads
│       ├── models/    # Mongoose schemas
│       ├── providers/ # LLM provider setup (OpenAI, Gemini, Anthropic)
│       ├── routes/    # 14 API route modules
│       ├── services/  # Business logic layer
│       ├── tools/     # Game mechanic tools (plant, combat, etc.)
│       └── __tests__/ # Centralized tests (28 files)
├── frontend/          # React SPA
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/     # Route pages (lazy-loaded)
│       ├── stores/    # Zustand state stores
│       ├── services/  # API client functions
│       ├── hooks/     # Custom React hooks
│       └── i18n/      # Internationalization (EN/VI)
└── .sisyphus/         # Agent workspace (do not modify manually)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `backend/src/routes/` | One file per resource group |
| Add AI behavior | `backend/src/agents/` | Each agent has system prompt + image gen |
| Add game mechanic | `backend/src/tools/` | Tools are called by agents during play |
| Add database schema | `backend/src/models/` | Mongoose models with TypeScript interfaces |
| Add frontend page | `frontend/src/pages/` | Auto-registered via React.lazy in App.tsx |
| Add global state | `frontend/src/stores/` | Zustand stores with persist middleware |
| Add API client | `frontend/src/services/` | Axios-based API functions |
| Add UI component | `frontend/src/components/` | TailwindCSS + Lucide icons |
| Add translation | `frontend/src/i18n/` | JSON key-value; EN, VI |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `app` | Express App | `backend/src/index.ts` | Main server bootstrap |
| `storyOrchestrator` | Module | `backend/src/services/storyOrchestrator.ts` | Core storytelling loop |
| `CombatService` | Class | `backend/src/services/combatService.ts` | Combat mechanics |
| `writerAgent` | Agent | `backend/src/agents/writerAgent.ts` | Narrative generation |
| `imageAgent` | Agent | `backend/src/agents/imageAgent.ts` | Image generation/queue |
| `contextAgent` | Agent | `backend/src/agents/contextAgent.ts` | Story state analysis |
| `supportAgent` | Agent | `backend/src/agents/supportAgent.ts` | World/character enrichment |
| `PlantConsequence` | Tool | `backend/src/tools/plantConsequence.ts` | Plant consequence mechanic |
| `App` | Component | `frontend/src/App.tsx` | Root with lazy routes |
| `useAuthStore` | Store | `frontend/src/stores/authStore.ts` | Auth state |
| `useStoryStore` | Store | `frontend/src/stores/storyStore.ts` | Narrative state |
| `useSettingsStore` | Store | `frontend/src/stores/settingsStore.ts` | App settings + i18n |

## CONVENTIONS
- **TypeScript strict** everywhere — `noUncheckedIndexedAccess` enabled
- **Mongoose**: Use `returnDocument: 'after'` (not `new: true`), add `.lean()` to read-only queries
- **Path aliases**: `@/` maps to `src/` in both backend and frontend
- **Imports**: Named exports preferred; use path aliases
- **Error handling**: Backend uses custom error classes (AppError, NotFoundError, etc.) via errorHandler middleware
- **API responses**: Consistent JSON shape `{ status, data, message }`
- **State management**: Zustand with `persist` middleware for settings/auth
- **Styling**: TailwindCSS v4 utility classes; custom theme colors (gold, narration, gem, tech)
- **Git commits**: `type: description` format (feat, fix, refactor, chore)

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT** use `new: true` in Mongoose — use `returnDocument: 'after'`
- **DO NOT** suppress types with `as any`, `@ts-ignore`, or `@ts-expect-error`
- **DO NOT** use `flex-shrink-0` — use `shrink-0` (Tailwind v4)
- **DO NOT** add new dependencies without discussion
- **DO NOT** remove existing tests to make test suite pass

## COMMANDS
```bash
# Backend
cd backend
npm run dev        # Start dev server (ts-node-dev)
npm run build      # Compile TypeScript
npm test           # Run tests
npm run test:watch # Watch mode

# Frontend
cd frontend
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run lint       # ESLint
npm test           # Run tests
```

## NOTES
- No CI/CD pipeline configured — GitHub Actions recommended
- No Docker setup — consider for deployment
- Backend tests use MongoDB Memory Server
- AI agents (writer, image, context, support) rely on environment variables for API keys
- Image generation uses an in-memory queue system
- i18n supports English and Vietnamese
