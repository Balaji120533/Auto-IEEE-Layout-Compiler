# Engine — Auto-IEEE Layout Compiler

Python + FastAPI + uv. Purely deterministic processing: accepts a JSON document model,
renders a `.docx` via `docxtpl`, converts to `.pdf` via headless LibreOffice.

No AI. No database. Every decision is encoded in the incoming JSON.

## Dev

```bash
uv sync                                                         # install deps
uv run uvicorn engine.main:app --reload --port 8000             # start server
```

Or from the repo root: `pnpm dev` starts all three tiers together.

## CLI test harness (Milestone 2)

```bash
uv run python -m engine.cli tests/fixtures/minimal.json
# → outputs/minimal.docx + outputs/minimal.pdf
```

## Environment

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8000` | Passed to uvicorn |
| `STORAGE_DIR` | `../gateway/storage` | Where image refs are resolved from |

## Template

Drop `ieee_template.docx` into `templates/` — see `templates/README.md`.

## Milestones

- **M1** (current): Skeleton + `/health`
- **M2**: Full compile pipeline — docx + pdf from JSON
- **M5**: Math backend v2/v3 (KaTeX, OMML) can drop in via the pluggable interface
