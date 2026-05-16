# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-16
**Branch:** master

## OVERVIEW
Tera-Story is an AI-powered interactive storytelling platform. Backend (Express + MongoDB/Mongoose + TypeScript) serves a REST API consumed by the React frontend (Vite + TailwindCSS + Zustand). AI agents (writer, image, context, support, map) generate narrative content via the Vercel AI SDK. The system features a 4-level geographic hierarchy (World > Continent > Region > Location), dynamic stat system with pool type (HP/MP current/max), entity archiving, and a game-like UI panel.

## STRUCTURE
```
Tera-Story/
├── backend/           # Express REST API server
│   └── src/
│       ├── agents/    # AI agents (writer, image, context, support, map)
│       │   ├── contextAgent.ts   # Story state analysis + context builder
│       │   ├── writerAgent.ts    # Two-pass narrative generation (prose + tools)
│       │   ├── supportAgent.ts   # World/character enrichment + whispers
│       │   ├── imageAgent.ts     # Image generation queue
│       │   ├── mapAgent.ts       # World map + location generation
│       │   └── prompts/          # LLM prompt templates (XML/MD)
│       ├── config/    # Database & app configuration
│       ├── jobs/      # Scheduled jobs (dailyReset)
│       ├── middleware/ # Auth, error handling, uploads
│       ├── models/    # Mongoose schemas (14 models)
│       ├── providers/ # LLM provider setup (OpenAI, Gemini, Anthropic)
│       ├── routes/    # API route modules
│       ├── seed/      # World templates seeder
│       ├── services/  # Business logic layer
│       ├── tools/     # Vercel AI SDK tools (15 tools)
│       ├── types/     # TypeScript interfaces
│       └── __tests__/ # Vitest tests
├── frontend/          # React SPA
│   └── src/
│       ├── components/ # Reusable UI components
│       │   ├── game/         # GamePanel (7-tab game interface)
│       │   ├── echoes/       # Echo indicator + list
│       │   ├── progression/  # Level badge, XP bar, panel, modal
│       │   ├── daily/        # Daily check-in, quests, streak
│       │   ├── social/       # Leaderboard, share, privacy
│       │   ├── fate/         # Peek modal, chapter detail
│       │   └── whispers/     # Whispers modal
│       ├── pages/     # Route pages (lazy-loaded)
│       ├── stores/    # Zustand state stores
│       ├── services/  # Axios-based API client functions
│       ├── hooks/     # Custom React hooks
│       ├── types/     # TypeScript entity interfaces
│       ├── i18n/      # Internationalization (EN/VI)
│       └── utils/     # Helper functions
└── .sisyphus/         # Agent workspace (do not modify manually)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `backend/src/routes/` | One file per resource group |
| Add AI behavior | `backend/src/agents/` | Each agent has system prompt in `prompts/` |
| Add game mechanic tool | `backend/src/tools/` | Vercel AI SDK `tool()` with Zod schema |
| Add database schema | `backend/src/models/` | Mongoose schemas with TypeScript interfaces |
| Add frontend page | `frontend/src/pages/` | Auto-registered via React.lazy in App.tsx |
| Add global state | `frontend/src/stores/` | Zustand stores with persist middleware |
| Add API client | `frontend/src/services/` | Axios-based API functions |
| Add UI component | `frontend/src/components/` | TailwindCSS + Lucide icons |
| Add translation | `frontend/src/i18n/` | Key-value; EN, VI |
| Add custom hook | `frontend/src/hooks/` | State + API call patterns |

## CORE SYSTEMS

### Dynamic Stat System
Characters, Items, SpecialItems, and Locations have `dynamicStats: IDynamicStat[]` where each stat is `{ k, v, t, maxV? }`. Stats are initialized from World `resourceTemplates` (for characters) or `locationResourceTemplates` (for locations).

**Stat types:** `number` | `text` | `progress` | `enum` | `pool`
- **pool**: Has `v` (current) + `maxV` (current maximum). Example: HP 80/100. Agent can update both. If `maxV` decreases, `v` auto-clamps.
- **progress**: Like number but rendered as a progress bar (0-100 scale).
- **enum**: Must pick from `resourceTemplate.options[]`.

### Entity Archive System
Characters, Items, SpecialItems, and Locations have `archivedAt: Date | null`. Pre-query hooks auto-filter `archivedAt: null` so archived entities are excluded from agent context. Archive viewer queries use `{ archivedAt: { $ne: null } }` to bypass.

- **Auto-archive**: Agent calls `archiveEntity` tool for dead/consumed/irrelevant entities.
- **Manual archive**: User can archive/restore via `GamePanel > Archive` tab.
- **Restore**: `POST /api/archive/:playthroughId/restore` sets `archivedAt = null`.

### Character Extended Fields
Characters have: `name`, `description`, `role`, `status`, `dynamicStats`, `background` (backstory), `personality` (traits), `goals` (motivations), `appearance` (physical description), `archivedAt`, `deletedAt`.

### Two-Pass Writer Agent
1. **Pass 1 (WRITE)**: Pure prose generation, no tools. 800-1500 words. Uses entity markup `[[char:Name]]`, `[[item:Name:rarity]]`, `[[special:Name:rarity]]`.
2. **Pass 2 (TOOLS)**: Analyzes chapter, calls all game-state tools in a single step. 15 tools available.
3. **Choices**: Separate step generates 3-4 reader choices with optional `travelTo` for location travel.

### Protagonist-First Flow
Playthrough creation requires a protagonist character before any chapter can be generated. Both `storyOrchestrator.generateChapter()` and `generateChapterStream()` enforce this guard.

### Language System
User language is stored in `UserSettings.language` (default `'en'`). Injected into all agent prompts via `{{language}}` template variable. Agents produce all content (names, descriptions, tool args) in the user's language.

### 4-Level Geography
World > Continent > Region > Location. Top 3 levels are world-level (shared). Location is playthrough-specific. Player position tracked via `playthrough.currentLocationId`.

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `app` | Express App | `backend/src/index.ts` | Main server bootstrap |
| `storyOrchestrator` | Module | `backend/src/services/storyOrchestrator.ts` | Core storytelling loop |
| `CombatService` | Class | `backend/src/services/combatService.ts` | Combat mechanics |
| `progressionService` | Module | `backend/src/services/progressionService.ts` | XP/level curve, stat increments |
| `characterService` | Module | `backend/src/services/characterService.ts` | Stat init, validation, pool type |
| `writerAgent` | Agent | `backend/src/agents/writerAgent.ts` | Two-pass narrative + tools |
| `contextAgent` | Agent | `backend/src/agents/contextAgent.ts` | Story state analysis + context JSON |
| `supportAgent` | Agent | `backend/src/agents/supportAgent.ts` | World/character enrichment + whispers |
| `mapAgent` | Agent | `backend/src/agents/mapAgent.ts` | World map + location generation |
| `imageAgent` | Agent | `backend/src/agents/imageAgent.ts` | Image generation queue |
| `archiveEntity` | Tool | `backend/src/tools/archiveEntity.ts` | Archive dead/consumed entities |
| `updateLocationStats` | Tool | `backend/src/tools/updateLocationStats.ts` | Update location dynamicStats |
| `updateStats` | Tool | `backend/src/tools/updateStats.ts` | Update character stats (incl. pool maxV) |
| `createCharacter` | Tool | `backend/src/tools/createCharacter.ts` | Create NPC with stats + extended fields |
| `createItem` | Tool | `backend/src/tools/createItem.ts` | Create story items |
| `createSpecialItem` | Tool | `backend/src/tools/createSpecialItem.ts` | Create abilities/skills |
| `discoverLocation` | Tool | `backend/src/tools/discoverLocation.ts` | Create new map locations |
| `updateEntityStatus` | Tool | `backend/src/tools/updateEntityStatus.ts` | Change entity status |
| `updateRelationship` | Tool | `backend/src/tools/updateRelationship.ts` | Manage character relationships |
| `plantConsequence` | Tool | `backend/src/tools/plantConsequence.ts` | Plant delayed consequence seeds |
| `initiateCombat` | Tool | `backend/src/tools/initiateCombat.ts` | Start combat encounter |
| `generateChoices` | Tool | `backend/src/tools/generateChoices.ts` | Set reader choices |
| `summarizeArc` | Tool | `backend/src/tools/summarizeArc.ts` | Summarize and complete arc |
| `archiveRouter` | Router | `backend/src/routes/archive.ts` | Archive list + restore |
| `Character` | Model | `backend/src/models/Character.ts` | Characters with extended fields + archive |
| `Item` | Model | `backend/src/models/Item.ts` | Items with archive |
| `SpecialItem` | Model | `backend/src/models/SpecialItem.ts` | Abilities with archive |
| `Location` | Model | `backend/src/models/Location.ts` | Locations with dynamicStats + archive |
| `World` | Model | `backend/src/models/World.ts` | World with resourceTemplates + locationResourceTemplates |
| `GamePanel` | Component | `frontend/src/components/game/GamePanel.tsx` | 7-tab game interface |
| `RPGPanel` | Component | `frontend/src/components/RPGPanel.tsx` | Stats/Inventory/Abilities/Relations tabs |
| `EntityDetailModal` | Component | `frontend/src/components/EntityDetailModal.tsx` | Entity detail with extended fields |
| `CharacterCard` | Component | `frontend/src/components/CharacterCard.tsx` | Character card with pool stats |
| `archiveApi` | API Client | `frontend/src/services/archiveApi.ts` | Archive API calls |
| `useArchive` | Hook | `frontend/src/hooks/useArchive.ts` | Archive state + restore |
| `useMap` | Hook | `frontend/src/hooks/useMap.ts` | Map context + locations |
| `App` | Component | `frontend/src/App.tsx` | Root with lazy routes |
| `useAuthStore` | Store | `frontend/src/stores/authStore.ts` | Auth state (persisted) |
| `useStoryStore` | Store | `frontend/src/stores/storyStore.ts` | Narrative state |
| `useSettingsStore` | Store | `frontend/src/stores/settingsStore.ts` | App settings + i18n |
| `Echo` | Model | `backend/src/models/Echo.ts` | Delayed consequence tracking |
| `WhispersCache` | Model | `backend/src/models/WhispersCache.ts` | AI-generated world whispers |
| `StoryCard` | Model | `backend/src/models/StoryCard.ts` | Pivotal scene collectible card |
| `Achievement` | Model | `backend/src/models/Achievement.ts` | Achievement definitions |
| `UserAchievement` | Model | `backend/src/models/UserAchievement.ts` | Player achievement progress |
| `CombatEncounter` | Model | `backend/src/models/CombatEncounter.ts` | Active combat state |
| `Relationship` | Model | `backend/src/models/Relationship.ts` | Character relationship graph |
| `ConsequenceSeed` | Model | `backend/src/models/ConsequenceSeed.ts` | Delayed consequence seeds |
| `DailyLogin` | Model | `backend/src/models/DailyLogin.ts` | Daily login streak |
| `DailyQuest` | Model | `backend/src/models/DailyQuest.ts` | Daily quest objectives |
| `Friendship` | Model | `backend/src/models/Friendship.ts` | Friend relationship |

## CONVENTIONS
- **TypeScript strict** everywhere — `noUncheckedIndexedAccess` enabled
- **Mongoose**: Use `returnDocument: 'after'` (not `new: true`), add `.lean()` to read-only queries
- **Path aliases**: `@/` maps to `src/` in both backend and frontend
- **Imports**: Named exports preferred; use path aliases
- **Error handling**: Backend uses custom error classes (AppError, NotFoundError, etc.) via errorHandler middleware
- **API responses**: Consistent JSON shape `{ status, data, message }`
- **State management**: Zustand with `persist` middleware for settings/auth
- **Styling**: TailwindCSS v4 utility classes; custom theme colors (ink, accent)
- **Git commits**: `type: description` format (feat, fix, refactor, chore)
- **AI Tools**: Factory pattern `makeXxxTool(params)` returning Vercel AI SDK `tool()` with Zod schemas
- **Soft delete**: Pre-query hooks auto-filter `deletedAt: null` and `archivedAt: null`
- **SSE events**: Real-time updates via Server-Sent Events for entity changes

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT** use `new: true` in Mongoose — use `returnDocument: 'after'`
- **DO NOT** suppress types with `as any`, `@ts-ignore`, or `@ts-expect-error`
- **DO NOT** use `flex-shrink-0` — use `shrink-0` (Tailwind v4)
- **DO NOT** add new dependencies without discussion
- **DO NOT** remove existing tests to make test suite pass
- **DO NOT** create trivial/background characters in tools — only significant recurring NPCs
- **DO NOT** create overly common special items — they must be unique and story-relevant

## COMMANDS
```bash
# Backend
cd backend
npm run dev        # Start dev server (ts-node-dev)
npm run build      # Compile TypeScript
npm test           # Run tests (Vitest)
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
- AI agents rely on environment variables for API keys (OpenAI, Anthropic, Google)
- Image generation uses an in-memory queue system
- i18n supports English and Vietnamese via custom `useTranslation()` hook (no external lib)
- Writer agent uses `{{language}}` template variable for language-aware prompt rendering
- 579 backend tests across 42 test files
