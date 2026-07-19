# Examples

Three ready-to-compile `DocumentModel` JSON fixtures, runnable directly through
the engine's CLI harness without the frontend or gateway:

```bash
cd engine
uv run python -m engine.cli ../examples/01-minimal.json
uv run python -m engine.cli ../examples/02-figures-equations-tables.json
uv run python -m engine.cli ../examples/03-citations-and-lists.json
```

Each produces `engine/outputs/<name>/output.docx` (and `output.pdf` if
LibreOffice is installed).

| File | Demonstrates |
|------|--------------|
| `01-minimal.json` | The smallest valid paper: title, one author, abstract, keywords, two sections. No figures, tables, or equations. |
| `02-figures-equations-tables.json` | A wide (full-width) figure, a display equation, a single-column table, and a wide table — the continuous section-break mechanism for wide content. |
| `03-citations-and-lists.json` | `[CITE n]` in-text citation anchors resolved against a 5-entry reference list, mixed bullet/numbered lists, and an intentionally long figure caption to check wrapping near a column boundary. |

`images/signal-comparison.png` is a generated placeholder figure referenced by
examples 2 and 3.

To try these through the full app instead of the CLI, paste the same content
into the structured editor at `localhost:3000` — the JSON here mirrors what
the frontend form produces internally.
