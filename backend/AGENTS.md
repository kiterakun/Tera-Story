# Backend Knowledge Base

**Part of:** Tera-Story monorepo

## OVERVIEW
Express + MongoDB/Mongoose + TypeScript REST API serving the Tera-Story frontend. 15 route modules, AI agent system via Vercel AI SDK, game mechanic tools, in-memory image generation queue, and interactive world map generation.

## STRUCTURE
```
backend/src/
├── agents/          # AI agents: writer, image, context, support, map
│   └── prompts/     # System prompts (writer, context, support, map)
├── config/          # DB connection + app configuration
├── middleware/       # auth, errorHandler, validate, rateLimiter
├── models/          # Mongoose schemas (User, World, Character, Continent, etc.)
├── providers/       # LLM provider configs (OpenAI, Gemini, Anthropic)
├── routes/          # 15 route modules under /api
├── services/        # Business logic: story, combat, character, image
├── tools/           # Game mechanic tools called by agents (12 tools)
├── types/           # Shared TypeScript types/interfaces
├── utils/           # Utilities (logger, helpers)
└── __tests__/       # Centralized test directory
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add API route | `routes/` | Mount in `src/index.ts` under `/api` |
| Add AI agent | `agents/` | Export function with system prompt; use `prompts/` dir for prompts |
| Add game tool | `tools/` | Must implement `execute()` method; factory function pattern `makeXxxTool()` |
| Add Mongoose model | `models/` | Export interface + schema + model; soft-delete pre hooks |
| Add business logic | `services/` | Called by routes and agents |
| Add middleware | `middleware/` | Apply in `src/index.ts` |
| Debug auth flow | `middleware/auth.ts` | JWT cookie-based |
| Map features | `routes/map.ts` | Interactive world map — Voronoi regions, 3-level zoom |

## CONVENTIONS
- **Routes**: Resource-based grouping (e.g., `worlds.ts`, `characters.ts`, `playthroughs.ts`)
- **Services**: Class-based, injected via constructor or imported directly
- **Models**: Mongoose with TypeScript interfaces; use `returnDocument: 'after'` and `.lean()` for reads
- **Error handling**: Throw custom errors (`NotFoundError`, `ValidationError`, etc.), handled by error middleware
- **Response format**: `{ status: 'success'|'error', data?: any, message?: string }`
- **Auth**: JWT in httpOnly cookies; `authLimiter` for login/register, `apiLimiter` for general
- **Testing**: Vitest + MongoDB Memory Server; centralized `__tests__/` with mirror structure

## ANTI-PATTERNS
- **DO NOT** import server code from frontend or vice versa
- **DO NOT** commit `.env` files — use `.env.example` as template
- **DO NOT** use `any` type — proper interfaces/types exist in `types/`
- **DO NOT** skip validation — use Mongoose schema validation + Zod for API input

## NOTES
- `uploads/images/` is gitignored; created at runtime
- Rate limits: 15 req/15min for auth, 100 req/15min for API
- ts-node-dev for development with `--respawn --transpile-only`
