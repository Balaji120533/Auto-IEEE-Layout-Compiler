"""Preflight checks: image DPI, PDF page count, overflow (best-effort)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

from engine.schema import DocumentModel, FigureBlock


MIN_DPI = 150   # warn below this; 300 is ideal for IEEE print


class PreflightWarning:
    def __init__(self, level: str, anchor: str, message: str) -> None:
        self.level = level    # "warn" | "error"
        self.anchor = anchor
        self.message = message

    def __str__(self) -> str:
        return f"[{self.level.upper()}] {self.anchor}: {self.message}"


def check_images(model: DocumentModel, storage_base: Path) -> list[PreflightWarning]:
    """Check image DPI for all figure blocks. Returns a list of warnings."""
    warnings: list[PreflightWarning] = []
    for block in model.blocks:
        if not isinstance(block, FigureBlock):
            continue
        img_path = storage_base / block.image_ref
        if not img_path.exists():
            warnings.append(PreflightWarning("error", block.anchor, f"Image not found: {img_path}"))
            continue
        try:
            with Image.open(img_path) as img:
                dpi = img.info.get("dpi")
                if dpi:
                    x_dpi, y_dpi = dpi
                    if min(x_dpi, y_dpi) < MIN_DPI:
                        warnings.append(PreflightWarning(
                            "warn", block.anchor,
                            f"Low DPI ({x_dpi:.0f}×{y_dpi:.0f}); ≥300 recommended for print.",
                        ))
        except Exception as exc:
            warnings.append(PreflightWarning("warn", block.anchor, f"Could not read image: {exc}"))
    return warnings


def check_pdf_pages(pdf_path: Path, max_pages: int = 8) -> list[PreflightWarning]:
    """Check that the rendered PDF doesn't exceed max_pages (warn only)."""
    warnings: list[PreflightWarning] = []
    if not pdf_path.exists():
        return warnings
    try:
        # Count %%Page: lines in the PDF as a fast heuristic
        content = pdf_path.read_bytes()
        count = content.count(b"/Page\n") + content.count(b"/Page ")
        if count > max_pages:
            warnings.append(PreflightWarning(
                "warn", "document",
                f"PDF is {count} pages; IEEE conference limit is typically {max_pages}.",
            ))
    except Exception:
        pass
    return warnings
