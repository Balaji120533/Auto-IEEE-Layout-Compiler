# Frontend — Auto-IEEE Layout Compiler

Next.js 14 App Router + Tailwind CSS + Framer Motion.

## Dev

```bash
pnpm dev          # starts on http://localhost:3000
```

## Environment

Copy `.env.local.example` to `.env.local` and adjust if your gateway/engine run on different ports.

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | `http://localhost:3001` |
| `NEXT_PUBLIC_ENGINE_URL` | `http://localhost:8000` |

## Milestones

- **M1** (current): Health-check status page — green dots when gateway + engine are reachable
- **M4**: Full two-pane editor UI
- **M5**: Gemini parse + grammar diff UI
