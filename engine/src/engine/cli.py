"""
CLI test harness for the Processing Engine.

Usage:
    uv run python -m engine.cli <path/to/fixture.json> [--storage <dir>]

Produces:
    outputs/<fixture-stem>/output.docx
    outputs/<fixture-stem>/output.pdf   (if LibreOffice is installed)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from engine.renderer.pipeline import RenderPipeline
from engine.schema import DocumentModel

OUTPUT_ROOT = Path(__file__).parent.parent.parent / "outputs"


async def _run(fixture: Path, storage_base: Path) -> None:
    raw = json.loads(fixture.read_text(encoding="utf-8"))
    model = DocumentModel(**raw)

    output_dir = OUTPUT_ROOT / fixture.stem
    output_dir.mkdir(parents=True, exist_ok=True)

    def progress(msg: str) -> None:
        print(f"  > {msg}")

    print(f"Compiling: {fixture.name}")
    pipeline = RenderPipeline(model, storage_base, output_dir, progress)
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
    args = parser.parse_args()

    fixture = args.fixture.resolve()
    if not fixture.exists():
        print(f"Error: fixture not found: {fixture}", file=sys.stderr)
        sys.exit(1)

    storage_base = args.storage.resolve() if args.storage else fixture.parent
    asyncio.run(_run(fixture, storage_base))


if __name__ == "__main__":
    main()
