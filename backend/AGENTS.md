# Backend Knowledge Base

**Part of:** Tera-Story monorepo

## OVERVIEW
Express + MongoDB/Mongoose + TypeScript REST API serving the Tera-Story frontend. 14 route modules, AI agent system via Vercel AI SDK, game mechanic tools, and image generation queue.

## STRUCTURE
```
backend/src/
├── agents/          # AI agents: writer, image, context, relationship
├── config/          # DB connection + app configuration
├── middleware/       # auth, errorHandler, upload, rateLimiter
├── models/          # Mongoose schemas (User, World, Character, etc.)
├── providers/       # LLM provider configs (OpenAI, Gemini)
├── routes/          # 14 route modules under /api
├── seeds/           # Database seeding scripts
├── services/        # Business logic: story, combat, character, image
├── tools/           # Game mechanic tools called by agents
├── types/           # Shared TypeScript types/interfaces
├── utils/           # Utilities (logger, helpers)
└── __tests__/       # Centralized test directory
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add API route | `routes/` | Mount in `src/index.ts` under `/api` |
| Add AI agent | `agents/` | Export function with system prompt |
| Add game tool | `tools/` | Must implement `execute()` method |
| Add Mongoose model | `models/` | Export interface + schema + model |
| Add business logic | `services/` | Called by routes and agents |
| Add middleware | `middleware/` | Apply in `src/index.ts` |
| Debug auth flow | `middleware/auth.ts` | JWT cookie-based |

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
- Graceful shutdown on SIGTERM/SIGINT (closes DB + HTTP server)
