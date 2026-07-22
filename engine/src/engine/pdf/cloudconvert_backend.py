"""
PDF backend: CloudConvert (https://cloudconvert.com) — free tier, 25
conversions/day. Requires CLOUDCONVERT_API_KEY. The .docx content is uploaded
to CloudConvert's servers for conversion — this is an explicit tradeoff for
users who don't want to install LibreOffice locally; LibreOfficeBackend stays
fully offline and is preferred when available.

API flow (CloudConvert "jobs" API, v2):
  1. POST /v2/jobs — define import/upload -> convert -> export/url tasks
  2. PUT to the returned upload form (multipart) with the docx bytes
  3. Poll GET /v2/jobs/{id} until status is finished/error
  4. GET the export task's result file URL and download the PDF
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Callable

import httpx

API_BASE = "https://api.cloudconvert.com/v2"
POLL_INTERVAL_S = 2.0
POLL_TIMEOUT_S = 120.0


class CloudConvertBackend:
    def __init__(self, api_key: str, progress: Callable[[str], None]) -> None:
        self.api_key = api_key
        self.progress = progress

    async def convert(self, docx_path: Path, output_dir: Path) -> Path | None:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                self.progress("CloudConvert: creating job...")
                job = await self._create_job(client, headers)
                if job is None:
                    return None

                upload_task = next(t for t in job["tasks"] if t["name"] == "import-docx")
                export_task_id = next(t["id"] for t in job["tasks"] if t["name"] == "export-pdf")

                self.progress("CloudConvert: uploading document...")
                await self._upload(client, upload_task, docx_path)

                self.progress("CloudConvert: converting...")
                file_url = await self._wait_for_export(client, headers, export_task_id)
                if file_url is None:
                    self.progress("CloudConvert: conversion timed out or failed.")
                    return None

                self.progress("CloudConvert: downloading PDF...")
                pdf_path = output_dir / "output.pdf"
                await self._download(client, file_url, pdf_path)
                self.progress(f"PDF saved → {pdf_path.name}")
                return pdf_path

        except httpx.HTTPStatusError as exc:
            self.progress(f"CloudConvert HTTP error: {exc.response.status_code} {exc.response.text[:200]}")
            return None
        except Exception as exc:
            self.progress(f"CloudConvert error: {exc}")
            return None

    async def _create_job(self, client: httpx.AsyncClient, headers: dict) -> dict | None:
        payload = {
            "tasks": {
                "import-docx": {"operation": "import/upload"},
                "convert-pdf": {
                    "operation": "convert",
                    "input": "import-docx",
                    "input_format": "docx",
                    "output_format": "pdf",
                },
                "export-pdf": {"operation": "export/url", "input": "convert-pdf"},
            }
        }
        res = await client.post(f"{API_BASE}/jobs", headers=headers, json=payload)
        res.raise_for_status()
        return res.json()["data"]

    async def _upload(self, client: httpx.AsyncClient, upload_task: dict, docx_path: Path) -> None:
        form = upload_task["result"]["form"]
        with open(docx_path, "rb") as f:
            files = {"file": (docx_path.name, f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            res = await client.post(form["url"], data=form["parameters"], files=files)
        res.raise_for_status()

    async def _wait_for_export(self, client: httpx.AsyncClient, headers: dict, export_task_id: str) -> str | None:
        elapsed = 0.0
        while elapsed < POLL_TIMEOUT_S:
            res = await client.get(f"{API_BASE}/tasks/{export_task_id}", headers=headers)
            res.raise_for_status()
            task = res.json()["data"]
            if task["status"] == "finished":
                files = task["result"]["files"]
                return files[0]["url"] if files else None
            if task["status"] == "error":
                self.progress(f"CloudConvert task error: {task.get('message', 'unknown')}")
                return None
            await asyncio.sleep(POLL_INTERVAL_S)
            elapsed += POLL_INTERVAL_S
        return None

    async def _download(self, client: httpx.AsyncClient, file_url: str, dest: Path) -> None:
        res = await client.get(file_url)
        res.raise_for_status()
        dest.write_bytes(res.content)
