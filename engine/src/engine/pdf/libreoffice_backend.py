"""PDF backend: LibreOffice headless (local, offline, no API key)."""
from __future__ import annotations

import asyncio
import shutil
from pathlib import Path
from typing import Callable


class LibreOfficeBackend:
    def __init__(self, progress: Callable[[str], None]) -> None:
        self.progress = progress

    @staticmethod
    def is_available() -> bool:
        return bool(shutil.which("soffice") or shutil.which("libreoffice"))

    async def convert(self, docx_path: Path, output_dir: Path) -> Path | None:
        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if not soffice:
            self.progress("LibreOffice not found — skipping PDF conversion.")
            return None

        self.progress("Converting DOCX → PDF via LibreOffice...")
        cmd = [
            soffice,
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(output_dir),
            str(docx_path),
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()

        if proc.returncode != 0:
            self.progress(f"LibreOffice error: {stderr.decode()[:200]}")
            return None

        pdf_path = output_dir / "output.pdf"
        if pdf_path.exists():
            self.progress(f"PDF saved → {pdf_path.name}")
            return pdf_path

        self.progress("LibreOffice ran but PDF file not found.")
        return None
