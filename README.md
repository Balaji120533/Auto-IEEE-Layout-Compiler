# Auto-IEEE Layout Compiler

Typesets unformatted research drafts into submission-ready **double-column IEEE
documents** (`.docx` + `.pdf`). Paste your title, abstract, sections, figures and
equations into a structured editor, watch a live preview build itself, and
download a fully formatted paper — no LaTeX, no Word wrangling.

> **Philosophy — a typesetter, not a writer.** The formatting engine is fully
> deterministic, with zero AI in the loop anywhere in the pipeline. Grammar
> checking is intentionally left to dedicated tools (e.g. Grammarly) rather
> than duplicated here.

---

## ✨ Features

- **Structured editor** — title, authors + affiliations, abstract, keywords,
  numbered sections, and per-section content blocks.
- **Rich content blocks** — paragraphs, sub-sections (A. / 1)), figures
  (single- and full-width), LaTeX equations, and bullet/numbered lists.
- **Live preview** — a real two-column IEEE mock-up that updates as you type,
  with **actual uploaded images** and **KaTeX-rendered equations** shown inline
  in document order.
- **Deterministic compile** — the form is serialised to a fully-resolved JSON
  document model and rendered to `.docx` + `.pdf` by the Python engine.
- **Async jobs** — compiles run as background jobs with live progress over SSE.
- **Preflight checks** — figure DPI, page count, and overflow warnings, listed
  in the compile panel after each run.
- **Citations** — type `[CITE n]` inline in any paragraph to insert an IEEE
  bracket citation `[n]` linked to your reference list.
- **Local persistence** — projects auto-save to `localStorage`; nothing leaves
  your machine.

---

## 🏗 Architecture

Three tiers, REST between them:

```
┌─────────────┐   REST/SSE   ┌──────────────┐   REST    ┌───────────────┐
│  Frontend   │ ───────────► │   Gateway    │ ────────► │    Engine     │
│  Next.js    │ ◄─────────── │  Fastify     │ ◄──────── │   FastAPI     │
│  :3000      │              │  :3001       │           │   :8000       │
└─────────────┘              └──────────────┘           └───────────────┘
   editor +                   orchestration,             deterministic
   live preview               object storage,            docx/pdf render
                              job management              (no AI, no DB)
```

| Tier | Tech | Port | Responsibility |
|------|------|------|----------------|
| **Frontend** | Next.js 14 (App Router), Tailwind, Framer Motion, KaTeX | 3000 | Two-pane editor + live preview; `localStorage` persistence |
| **Gateway** | Node.js, Fastify, TypeScript | 3001 | REST API, image object-storage, async compile jobs (SSE) |
| **Engine** | Python 3.11, FastAPI, docxtpl / python-docx, matplotlib, LibreOffice | 8000 | Purely deterministic `.docx` + `.pdf` generation, preflight |

The **Gateway → Engine** contract is a fully-resolved JSON document model —
the Python side makes **zero** inference decisions. It's defined in
[`shared/schema/`](shared/schema/) as TypeScript types
([`document_model.ts`](shared/schema/document_model.ts)) **and** Pydantic models
([`document_model.py`](shared/schema/document_model.py)), kept in sync by hand.

---

## 🚀 Quick Start

**Prerequisites**

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- [LibreOffice](https://www.libreoffice.org/) (headless — needed for PDF output)

**Install & run**

```bash
# 1. Install everything (JS workspaces + Python venv)
pnpm run install:all

# 2. Copy env template (optional — sane defaults are baked in)
cp .env.example .env

# 3. Start all three services with one command
pnpm dev          # or: make dev
```

Open **[http://localhost:3000](http://localhost:3000)**. When the header shows
two green dots, the gateway and engine are both reachable and you're ready to
type your paper.

> **Windows note:** the dev runner starts the engine via
> [`scripts/dev-engine.ps1`](scripts/dev-engine.ps1). If port 3000 is stuck from
> a previous run:
> ```powershell
> Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
> Stop-Process -Id <PID> -Force
> ```

---

## 🧑‍💻 Usage

1. **Fill the form** on the left — title, authors, abstract, keywords.
2. **Add sections**, and inside each section add content blocks: paragraphs,
   sub-sections, figures (click to upload an image), equations
   (`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}` — no `$$` needed), and lists. Type
   `[CITE 1]` inside a paragraph to cite reference #1 — it renders as `[1]`.
3. **Watch the right pane** render a live two-column IEEE preview with your
   real images and typeset equations.
4. **Click Compile** to generate the `.docx` and `.pdf`. Any preflight warnings
   (low-DPI figures, page count, etc.) are listed above the download buttons.
   Download once the job finishes.

A headless / scriptable path exists too — the engine has a CLI test harness.
See [`examples/`](examples/) for 3 ready-to-run fixtures:

```bash
cd engine
uv run python -m engine.cli ../examples/01-minimal.json
```

---

## 📂 Project Structure

```
├── frontend/        Next.js editor + live preview
│   └── src/
│       ├── app/                 App Router pages
│       ├── components/          editor/, form/  UI
│       ├── hooks/               useFormProject, useCompileJob
│       └── lib/                 api client, formToModel, parsePreview
├── gateway/         Fastify orchestrator
│   └── src/
│       ├── routes/              projects, jobs
│       └── services/            object-storage, engine-client, job runner
├── engine/          FastAPI deterministic renderer
│   └── src/engine/
│       ├── renderer/            docx_builder, pipeline, styles
│       ├── math/                pluggable math backends (v1: matplotlib)
│       ├── preflight/           DPI / page-count / overflow checks
│       └── cli.py               local test harness
├── shared/          JSON document-model schema (TS + Pydantic) + docs
├── examples/        3 ready-to-compile sample papers (see examples/README.md)
├── scripts/         dev-engine runner, schema-check
├── Makefile         make dev / make install
└── package.json     pnpm workspaces + concurrently dev runner
```

---