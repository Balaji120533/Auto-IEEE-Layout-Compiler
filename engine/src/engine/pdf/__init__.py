"""
PDF backend selection. LibreOffice (local, offline, free) is preferred when
installed. Otherwise cloud backends are tried in order — CloudConvert first,
then Adobe PDF Services as a fallback if CloudConvert is unavailable or its
conversion fails — so a single cloud outage doesn't take out PDF output.
"""
from __future__ import annotations

import os
from typing import Callable

from engine.pdf.adobe_backend import AdobeBackend
from engine.pdf.base import PdfBackend
from engine.pdf.cloudconvert_backend import CloudConvertBackend
from engine.pdf.libreoffice_backend import LibreOfficeBackend


def _env(name: str) -> str | None:
    # Host dashboards (Render, etc.) can silently include a trailing newline
    # or space when a credential is pasted in — httpx then rejects the header
    # value outright ("Illegal header value") instead of just misauthenticating,
    # which otherwise looks like the credential itself is wrong.
    value = os.environ.get(name)
    return value.strip() if value else None


def select_backends(progress: Callable[[str], None]) -> list[PdfBackend]:
    """Ordered list of backends to try, in order, until one succeeds."""
    forced = _env("PDF_BACKEND")  # "libreoffice" | "cloudconvert" | "adobe"

    if forced == "libreoffice":
        return [LibreOfficeBackend(progress)] if LibreOfficeBackend.is_available() else []
    if forced == "cloudconvert":
        api_key = _env("CLOUDCONVERT_API_KEY")
        return [CloudConvertBackend(api_key, progress)] if api_key else []
    if forced == "adobe":
        client_id = _env("PDF_SERVICES_CLIENT_ID")
        client_secret = _env("PDF_SERVICES_CLIENT_SECRET")
        return [AdobeBackend(client_id, client_secret, progress)] if client_id and client_secret else []

    backends: list[PdfBackend] = []
    if LibreOfficeBackend.is_available():
        backends.append(LibreOfficeBackend(progress))

    cloudconvert_key = _env("CLOUDCONVERT_API_KEY")
    if cloudconvert_key:
        backends.append(CloudConvertBackend(cloudconvert_key, progress))

    adobe_client_id = _env("PDF_SERVICES_CLIENT_ID")
    adobe_client_secret = _env("PDF_SERVICES_CLIENT_SECRET")
    if adobe_client_id and adobe_client_secret:
        backends.append(AdobeBackend(adobe_client_id, adobe_client_secret, progress))

    if not backends:
        progress(
            "No PDF backend available (LibreOffice not found, CLOUDCONVERT_API_KEY and "
            "PDF_SERVICES_CLIENT_ID/SECRET not set) — skipping PDF conversion."
        )
    return backends
