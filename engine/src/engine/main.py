import os
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine.api.compile import router as compile_router
from engine.api.jobs import router as jobs_router

app = FastAPI(title="IEEE Paper Compiler — Engine", version="0.2.0")

# Dev defaults; in deployment the gateway lives on another origin, so its URL
# is supplied via ALLOWED_ORIGINS (comma-separated) rather than hardcoded.
_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_env_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_origins or _default_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compile_router)
app.include_router(jobs_router)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "engine",
        "version": "0.2.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
