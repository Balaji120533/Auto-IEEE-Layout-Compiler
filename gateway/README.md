# Gateway — Auto-IEEE Layout Compiler

Node.js + Fastify + TypeScript. Orchestrates compile jobs, proxies AI calls, manages object storage.

## Dev

```bash
pnpm dev          # starts on http://localhost:3001 with hot-reload via tsx
```

## Environment

Copy `.env.example` to `.env` and fill in values.

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3001` | |
| `ENGINE_URL` | `http://localhost:8000` | |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `GEMINI_API_KEY` | — | Required for M5 |
| `AI_FEATURES_ENABLED` | `false` | Feature flag for all Gemini routes |

## Endpoints (M1)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service liveness check |

## Milestones

- **M1** (current): Skeleton + `/health`
- **M3**: Project CRUD, image upload, compile orchestration, SSE job stream
- **M5**: Gemini parse + grammar endpoints
