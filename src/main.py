"""
main.py — FastAPI application entry point.

Wires together:
  - AsyncIOScheduler (APScheduler) — started/stopped via lifespan
  - Shared httpx.AsyncClient       — initialised/closed via lifespan
    - CORSMiddleware                 — allows configured frontend origins
  - API router                     — all endpoints from api/routes.py
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.core.config import settings
from src.services import vapi_service

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan: startup & shutdown ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info("Starting Riverwood Voice Agent backend…")

    vapi_service.init_client()

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.start()
    app.state.scheduler = scheduler
    logger.info("APScheduler started (in-memory, UTC).")

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down…")
    scheduler.shutdown(wait=False)
    await vapi_service.close_client()
    logger.info("Clean shutdown complete.")


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Riverwood Voice Agent",
    description="Outbound AI calling backend for Riverwood Projects CRM",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow only configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS enabled for origins: %s", settings.cors_origins_list)

app.include_router(router)


# ── Dev runner ────────────────────────────────────────────────────────────────
def main() -> None:
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
