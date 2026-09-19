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
    want_pdf: bool = False,
) -> None:
    """Background task: render docx (+ optional pdf), update the job store throughout."""
    def progress(msg: str) -> None:
        job_store.push_message(job_id, msg)

    def warn(level: str, anchor: str, message: str) -> None:
        job_store.push_warning(job_id, level, anchor, message)

    job_store.set_running(job_id)
    try:
        pipeline = RenderPipeline(model, storage_base, output_dir, progress, warn, want_pdf=want_pdf)
        artifacts = await pipeline.run()
        job_store.set_done(job_id, artifacts)
    except Exception as exc:
        # This runs as a detached asyncio task (fire-and-forget from
        # api/compile.py) — nothing awaits it, so re-raising here would only
        # produce an "exception was never retrieved" warning with no other
        # effect. set_failed is the actual, observable failure path; the
        # frontend reads job status, not this task's result.
        job_store.set_failed(job_id, str(exc))
