from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Callable

from engine.jobs.store import job_store
from engine.renderer.pipeline import RenderPipeline
from engine.schema import DocumentModel


async def run_compile_job(
    job_id: str,
    model: DocumentModel,
    storage_base: Path,
    output_dir: Path,
) -> None:
    """Background task: render docx + pdf, update the job store throughout."""
    def progress(msg: str) -> None:
        job_store.push_message(job_id, msg)

    def warn(level: str, anchor: str, message: str) -> None:
        job_store.push_warning(job_id, level, anchor, message)

    job_store.set_running(job_id)
    try:
        pipeline = RenderPipeline(model, storage_base, output_dir, progress, warn)
        artifacts = await pipeline.run()
        job_store.set_done(job_id, artifacts)
    except Exception as exc:
        job_store.set_failed(job_id, str(exc))
        raise
