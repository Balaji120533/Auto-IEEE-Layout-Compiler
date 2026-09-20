from __future__ import annotations

import asyncio
import hashlib
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.jobs.runner import run_compile_job
from engine.jobs.store import job_store
from engine.schema import DocumentModel, FigureBlock

router = APIRouter()

OUTPUT_ROOT = Path(__file__).parent.parent.parent.parent.parent / "outputs"
STORAGE_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent / "gateway" / "storage"


class CompileRequest(BaseModel):
    document: DocumentModel
    storage_base: str | None = None  # local-FS override; ignored when image_refs_are_urls
    # True when each FigureBlock.image_ref is already a full URL (Cloudinary,
    # R2, ...) rather than a path relative to storage_base — required whenever
    # gateway and engine are separate services with separate filesystems (e.g.
    # on Render), since an uploaded image only ever exists on the gateway's
    # own disk otherwise. Each backend builds URLs differently (R2 is a plain
    # baseURL+key join, Cloudinary embeds its config into the path via its own
    # builder), so the gateway resolves the full URL per-image rather than
    # this endpoint trying to reconstruct one from a shared prefix.
    image_refs_are_urls: bool = False
    want_docx: bool = True
    want_pdf: bool = False


class CompileResponse(BaseModel):
    job_id: str
    status: str


def _local_key_for_url(url: str) -> str:
    """A stable, filesystem-safe relative path standing in for a downloaded
    URL, preserving the original extension so DPI sniffing / MIME lookups
    downstream still work off a real file suffix."""
    suffix = Path(url.split("?", 1)[0]).suffix or ".bin"
    return f"{hashlib.sha256(url.encode()).hexdigest()}{suffix}"


async def _download_images_by_url(document: DocumentModel, dest_dir: Path) -> DocumentModel:
    """Downloads each figure's image_ref (a full URL) into dest_dir under a
    synthetic local key, then returns a copy of the document with image_ref
    rewritten to that local key — so downstream code (docx_builder, preflight
    checks) keeps doing `storage_base / image_ref` completely unchanged."""
    urls = {b.image_ref for b in document.blocks if isinstance(b, FigureBlock)}
    if not urls:
        return document

    url_to_key = {url: _local_key_for_url(url) for url in urls}

    async with httpx.AsyncClient(timeout=30.0) as client:
        for url, key in url_to_key.items():
            res = await client.get(url)
            res.raise_for_status()
            (dest_dir / key).write_bytes(res.content)

    updated_blocks = [
        block.model_copy(update={"image_ref": url_to_key[block.image_ref]})
        if isinstance(block, FigureBlock)
        else block
        for block in document.blocks
    ]
    return document.model_copy(update={"blocks": updated_blocks})


@router.post("/compile", response_model=CompileResponse)
async def compile_document(req: CompileRequest) -> CompileResponse:
    job = job_store.create()

    output_dir = OUTPUT_ROOT / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    document = req.document
    if req.image_refs_are_urls:
        images_dir = output_dir / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        try:
            document = await _download_images_by_url(req.document, images_dir)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to fetch image from storage: {exc}")
        storage_base = images_dir
    else:
        storage_base = Path(req.storage_base) if req.storage_base else STORAGE_ROOT

    asyncio.create_task(
        run_compile_job(job.id, document, storage_base, output_dir, req.want_pdf)
    )

    return CompileResponse(job_id=job.id, status=job.status.value)
