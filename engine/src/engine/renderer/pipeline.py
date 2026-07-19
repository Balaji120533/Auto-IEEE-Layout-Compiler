"""Orchestrates math rendering → docx build → preflight → PDF conversion."""
from __future__ import annotations

import asyncio
import subprocess
import shutil
from pathlib import Path
from typing import Callable

from engine.math.matplotlib_backend import MatplotlibMathBackend
from engine.preflight.checks import check_images, check_pdf_pages
from engine.renderer.docx_builder import DocxBuilder
from engine.schema import DocumentModel, EquationBlock


class RenderPipeline:
    def __init__(
        self,
        model: DocumentModel,
        storage_base: Path,
        output_dir: Path,
        progress: Callable[[str], None],
        warn: Callable[[str, str, str], None] | None = None,
    ) -> None:
        self.model = model
        self.storage_base = storage_base
        self.output_dir = output_dir
        self.progress = progress
        # (level, anchor, message) -> recorded as structured job data, not just
        # a log line, so the frontend can list preflight issues distinctly
        # from ordinary progress messages. No-op default keeps the CLI harness
        # (which only cares about console output) working unchanged.
        self.warn = warn or (lambda level, anchor, message: None)

    async def run(self) -> dict[str, str]:
        artifacts: dict[str, str] = {}

        # 1 — Pre-render preflight (images)
        self.progress("Checking images...")
        warnings = check_images(self.model, self.storage_base)
        for w in warnings:
            self.progress(f"  Preflight {w}")
            self.warn(w.level, w.anchor, w.message)

        # 2 — Render math equations to PNG
        eq_blocks = [b for b in self.model.blocks if isinstance(b, EquationBlock)]
        math_images: dict[str, Path] = {}
        if eq_blocks:
            self.progress(f"Rendering {len(eq_blocks)} equation(s)...")
            eq_dir = self.output_dir / "eq"
            backend = MatplotlibMathBackend(eq_dir)
            for eq in eq_blocks:
                img = await asyncio.get_event_loop().run_in_executor(
                    None, backend.render, eq.latex, eq.inline
                )
                math_images[eq.anchor] = img

        # 3 — Build DOCX
        self.progress("Building DOCX...")
        builder = DocxBuilder(self.storage_base, self.output_dir, math_images)
        doc = await asyncio.get_event_loop().run_in_executor(
            None, builder.build, self.model
        )
        docx_path = self.output_dir / "output.docx"
        await asyncio.get_event_loop().run_in_executor(None, doc.save, str(docx_path))
        artifacts["output.docx"] = str(docx_path)
        self.progress(f"DOCX saved → {docx_path.name}")

        # 4 — Convert to PDF via LibreOffice headless
        pdf_path = await self._convert_to_pdf(docx_path)
        if pdf_path:
            artifacts["output.pdf"] = str(pdf_path)
            warnings = check_pdf_pages(pdf_path)
            for w in warnings:
                self.progress(f"  Preflight {w}")
                self.warn(w.level, w.anchor, w.message)

        return artifacts

    async def _convert_to_pdf(self, docx_path: Path) -> Path | None:
        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if not soffice:
            self.progress("LibreOffice not found — skipping PDF conversion.")
            return None

        self.progress("Converting DOCX → PDF via LibreOffice...")
        cmd = [
            soffice,
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(self.output_dir),
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

        pdf_path = self.output_dir / "output.pdf"
        if pdf_path.exists():
            self.progress(f"PDF saved → {pdf_path.name}")
            return pdf_path

        self.progress("LibreOffice ran but PDF file not found.")
        return None
