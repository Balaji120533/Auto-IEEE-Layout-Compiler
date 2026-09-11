"""
PDF backend: Adobe PDF Services (https://developer.adobe.com/document-services)
— free tier, 500 document transactions/month. Requires PDF_SERVICES_CLIENT_ID
and PDF_SERVICES_CLIENT_SECRET. The .docx content is uploaded to Adobe's
servers for conversion, same tradeoff as CloudConvertBackend. Used as a
fallback when CloudConvert is unavailable or fails.

API flow (Adobe PDF Services REST API v1, server-to-server OAuth):
  1. POST /token — exchange client id/secret for an access token
  2. POST /assets — register an upload and get a presigned URI
  3. PUT to the presigned URI with the docx bytes
  4. POST /operation/createpdf — start the conversion job
  5. Poll GET <job location> until status is done/failed
  6. GET the result asset's download URI and download the PDF
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Callable

import httpx

IMS_BASE = "https://ims-na1.adobelogin.com"
API_BASE = "https://pdf-services.adobe.io"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
POLL_INTERVAL_S = 2.0
POLL_TIMEOUT_S = 120.0


class AdobeBackend:
    def __init__(self, client_id: str, client_secret: str, progress: Callable[[str], None]) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.progress = progress

    async def convert(self, docx_path: Path, output_dir: Path) -> Path | None:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                self.progress("Adobe PDF Services: authenticating...")
                access_token = await self._get_access_token(client)
                if access_token is None:
                    return None

                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "x-api-key": self.client_id,
                }

                self.progress("Adobe PDF Services: uploading document...")
                asset_id = await self._upload(client, headers, docx_path)
                if asset_id is None:
                    return None

                self.progress("Adobe PDF Services: converting...")
                job_location = await self._create_job(client, headers, asset_id)
                if job_location is None:
                    return None

                download_uri = await self._wait_for_job(client, headers, job_location)
                if download_uri is None:
                    self.progress("Adobe PDF Services: conversion timed out or failed.")
                    return None

                self.progress("Adobe PDF Services: downloading PDF...")
                pdf_path = output_dir / "output.pdf"
                await self._download(client, download_uri, pdf_path)
                self.progress(f"PDF saved → {pdf_path.name}")
                return pdf_path

        except httpx.HTTPStatusError as exc:
            self.progress(f"Adobe PDF Services HTTP error: {exc.response.status_code} {exc.response.text[:200]}")
            return None
        except Exception as exc:
            self.progress(f"Adobe PDF Services error: {exc}")
            return None

    async def _get_access_token(self, client: httpx.AsyncClient) -> str | None:
        res = await client.post(
            f"{IMS_BASE}/ims/token/v3",
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "openid,AdobeID,DCAPI",
            },
        )
        if res.status_code == 401 or res.status_code == 400:
            self.progress(f"Adobe PDF Services: authentication failed ({res.status_code}).")
            return None
        res.raise_for_status()
        return res.json()["access_token"]

    async def _upload(self, client: httpx.AsyncClient, headers: dict, docx_path: Path) -> str | None:
        res = await client.post(
            f"{API_BASE}/assets",
            headers={**headers, "Content-Type": "application/json"},
            json={"mediaType": DOCX_MIME},
        )
        res.raise_for_status()
        data = res.json()
        upload_uri = data["uploadUri"]
        asset_id = data["assetID"]

        with open(docx_path, "rb") as f:
            put_res = await client.put(
                upload_uri,
                content=f.read(),
                headers={"Content-Type": DOCX_MIME},
            )
        put_res.raise_for_status()
        return asset_id

    async def _create_job(self, client: httpx.AsyncClient, headers: dict, asset_id: str) -> str | None:
        res = await client.post(
            f"{API_BASE}/operation/createpdf",
            headers={**headers, "Content-Type": "application/json"},
            json={"assetID": asset_id},
        )
        if res.status_code == 429:
            self.progress("Adobe PDF Services: usage limit reached (500 document transactions/month on the free tier).")
            return None
        res.raise_for_status()
        return res.headers.get("location")

    async def _wait_for_job(self, client: httpx.AsyncClient, headers: dict, job_location: str) -> str | None:
        elapsed = 0.0
        while elapsed < POLL_TIMEOUT_S:
            res = await client.get(job_location, headers=headers)
            res.raise_for_status()
            body = res.json()
            status = body.get("status")
            if status == "done":
                return body["asset"]["downloadUri"]
            if status == "failed":
                self.progress(f"Adobe PDF Services job failed: {body.get('error', 'unknown')}")
                return None
            await asyncio.sleep(POLL_INTERVAL_S)
            elapsed += POLL_INTERVAL_S
        return None

    async def _download(self, client: httpx.AsyncClient, download_uri: str, dest: Path) -> None:
        res = await client.get(download_uri)
        res.raise_for_status()
        dest.write_bytes(res.content)
