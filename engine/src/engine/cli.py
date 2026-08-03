"""
CLI test harness for the Processing Engine.

Usage:
    uv run python -m engine.cli <path/to/fixture.json> [--storage <dir>] [--pdf]

Produces:
    outputs/<fixture-stem>/output.docx
    outputs/<fixture-stem>/output.pdf   (only with --pdf)

PDF conversion is opt-in because it uses LibreOffice when installed and
otherwise falls back to CloudConvert, which is metered.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from engine.renderer.pipeline import RenderPipeline
from engine.schema import DocumentModel

OUTPUT_ROOT = Path(__file__).parent.parent.parent / "outputs"


async def _run(fixture: Path, storage_base: Path, want_pdf: bool) -> None:
    raw = json.loads(fixture.read_text(encoding="utf-8"))
    model = DocumentModel(**raw)

    output_dir = OUTPUT_ROOT / fixture.stem
    output_dir.mkdir(parents=True, exist_ok=True)

    def progress(msg: str) -> None:
        print(f"  > {msg}")

    print(f"Compiling: {fixture.name}")
    pipeline = RenderPipeline(model, storage_base, output_dir, progress, want_pdf=want_pdf)
    artifacts = await pipeline.run()

    print("\nArtifacts:")
    for name, path in artifacts.items():
        print(f"  {name}: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="IEEE Paper Compiler — Engine CLI")
    parser.add_argument("fixture", type=Path, help="Path to a DocumentModel JSON fixture")
    parser.add_argument(
        "--storage", type=Path, default=None,
        help="Base directory for image refs (default: fixture's parent directory)",
    )
    # Opt-in: without LibreOffice installed, PDF conversion falls through to
    # CloudConvert and spends a metered credit per run. Most CLI use is
    # checking the .docx, so don't charge for a PDF nobody asked for.
    parser.add_argument(
        "--pdf", action="store_true",
        help="Also convert to PDF (uses LibreOffice if installed, otherwise a "
             "CloudConvert credit). Off by default.",
    )
    args = parser.parse_args()

    fixture = args.fixture.resolve()
    if not fixture.exists():
        print(f"Error: fixture not found: {fixture}", file=sys.stderr)
        sys.exit(1)

    storage_base = args.storage.resolve() if args.storage else fixture.parent
    asyncio.run(_run(fixture, storage_base, args.pdf))


if __name__ == "__main__":
    main()
