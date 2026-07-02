from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.jobs.runner import run_compile_job
from engine.jobs.store import job_store
from engine.schema import DocumentModel

router = APIRouter()

OUTPUT_ROOT = Path(__file__).parent.parent.parent.parent.parent / "outputs"
STORAGE_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent / "gateway" / "storage"


class CompileRequest(BaseModel):
    document: DocumentModel
    storage_base: str | None = None  # override path for image resolution


class CompileResponse(BaseModel):
    job_id: str
    status: str


@router.post("/compile", response_model=CompileResponse)
async def compile_document(req: CompileRequest) -> CompileResponse:
    job = job_store.create()

    storage_base = Path(req.storage_base) if req.storage_base else STORAGE_ROOT
    output_dir = OUTPUT_ROOT / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    asyncio.create_task(
        run_compile_job(job.id, req.document, storage_base, output_dir)
    )

    return CompileResponse(job_id=job.id, status=job.status.value)
