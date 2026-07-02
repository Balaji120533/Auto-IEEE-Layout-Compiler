from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from engine.jobs.store import job_store

router = APIRouter(prefix="/jobs")


@router.get("/{job_id}/status")
async def job_status(job_id: str) -> dict:
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@router.get("/{job_id}/stream")
async def job_stream(job_id: str) -> StreamingResponse:
    """Server-Sent Events stream for live job progress."""
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    async def generate():
        # Send all buffered messages first
        for msg in job.messages:
            yield f"data: {json.dumps({'type': 'progress', 'message': msg})}\n\n"

        if job.status.value in ("done", "failed"):
            yield f"data: {json.dumps({'type': job.status.value})}\n\n"
            return

        q = job_store.subscribe(job_id)
        try:
            while True:
                event = await asyncio.wait_for(q.get(), timeout=30.0)
                if event is None:
                    break
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("type") in ("done", "failed"):
                    break
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'type': 'keepalive'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/{job_id}/artifacts/{filename}")
async def download_artifact(job_id: str, filename: str) -> FileResponse:
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    artifact_path = job.artifacts.get(filename)
    if artifact_path is None:
        raise HTTPException(status_code=404, detail="Artifact not found")

    path = Path(artifact_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Artifact file missing")

    return FileResponse(str(path), filename=filename)
