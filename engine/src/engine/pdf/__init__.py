"""
PDF backend selection. LibreOffice (local, offline, free) is preferred when
installed; CloudConvert (cloud API, free tier, requires an API key and
uploads the document) is the fallback for setups without LibreOffice.
Selected once per pipeline run via `select_backend`.
"""
from __future__ import annotations

import os
from typing import Callable

from engine.pdf.base import PdfBackend
from engine.pdf.cloudconvert_backend import CloudConvertBackend
from engine.pdf.libreoffice_backend import LibreOfficeBackend


def select_backend(progress: Callable[[str], None]) -> PdfBackend | None:
    forced = os.environ.get("PDF_BACKEND")  # "libreoffice" | "cloudconvert"

    if forced != "cloudconvert" and LibreOfficeBackend.is_available():
        return LibreOfficeBackend(progress)

    api_key = os.environ.get("CLOUDCONVERT_API_KEY")
    if api_key:
        return CloudConvertBackend(api_key, progress)

    if forced == "cloudconvert":
        progress("CLOUDCONVERT_API_KEY not set — skipping PDF conversion.")
    else:
        progress("No PDF backend available (LibreOffice not found, CLOUDCONVERT_API_KEY not set) — skipping PDF conversion.")
    return None
