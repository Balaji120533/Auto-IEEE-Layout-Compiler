"""
PDF backend interface. Each backend converts a .docx file to .pdf and returns
the output path, or None if conversion isn't possible (missing tool/config) —
callers treat a missing PDF as non-fatal, since .docx is always produced.
"""
from __future__ import annotations

from pathlib import Path
from typing import Protocol


class PdfBackend(Protocol):
    async def convert(self, docx_path: Path, output_dir: Path) -> Path | None: ...
