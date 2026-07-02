from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine.api.compile import router as compile_router
from engine.api.jobs import router as jobs_router

app = FastAPI(title="IEEE Paper Compiler — Engine", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
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
