from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class Job:
    def __init__(self, job_id: str) -> None:
        self.id = job_id
        self.status = JobStatus.PENDING
        self.messages: list[str] = []
        self.artifacts: dict[str, str] = {}
        self.error: str | None = None
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        self._queues: list[asyncio.Queue[Any]] = []

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status.value,
            "messages": self.messages,
            "artifacts": self.artifacts,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}

    def create(self) -> Job:
        job = Job(str(uuid.uuid4()))
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def push_message(self, job_id: str, message: str) -> None:
        job = self._jobs[job_id]
        job.messages.append(message)
        job.updated_at = datetime.now(timezone.utc)
        self._broadcast(job_id, {"type": "progress", "message": message})

    def set_running(self, job_id: str) -> None:
        job = self._jobs[job_id]
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc)
        self._broadcast(job_id, {"type": "status", "status": "running"})

    def set_done(self, job_id: str, artifacts: dict[str, str]) -> None:
        job = self._jobs[job_id]
        job.status = JobStatus.DONE
        job.artifacts = artifacts
        job.updated_at = datetime.now(timezone.utc)
        self._broadcast(job_id, {"type": "done", "artifacts": artifacts})
        self._close(job_id)

    def set_failed(self, job_id: str, error: str) -> None:
        job = self._jobs[job_id]
        job.status = JobStatus.FAILED
        job.error = error
        job.updated_at = datetime.now(timezone.utc)
        self._broadcast(job_id, {"type": "failed", "error": error})
        self._close(job_id)

    def subscribe(self, job_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        job = self._jobs.get(job_id)
        if job:
            job._queues.append(q)
        return q

    def _broadcast(self, job_id: str, event: dict) -> None:
        job = self._jobs.get(job_id)
        if job:
            for q in job._queues:
                q.put_nowait(event)

    def _close(self, job_id: str) -> None:
        job = self._jobs.get(job_id)
        if job:
            for q in job._queues:
                q.put_nowait(None)
            job._queues.clear()


job_store = JobStore()
