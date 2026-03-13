"""
routes.py — API endpoints.

POST /api/calls/trigger  — fire or schedule an outbound Vapi call.
POST /api/webhook/vapi   — receive Vapi end-of-call reports & log them.
GET  /health             — liveness probe for Docker / Koyeb.
"""

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import APIRouter, Depends, Request, status

from src.core.config import settings
from src.schemas.call_schemas import (
    CallRequest,
    CallResponse,
    FrontendCallConfig,
    WebhookPayload,
)
from src.services import vapi_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Dependency: extract the scheduler attached to app.state ──────────────────
def get_scheduler(request: Request) -> AsyncIOScheduler:
    return request.app.state.scheduler


# ── Scheduled job (must be module-level for APScheduler to serialize) ────────
async def _scheduled_call(phone_number: str, customer_name: str) -> None:
    """Wrapper executed by APScheduler at the scheduled datetime."""
    logger.info("APScheduler firing scheduled call to %s", phone_number)
    try:
        await vapi_service.trigger_call(phone_number, customer_name)
    except Exception as exc:  # noqa: BLE001
        logger.error("Scheduled call failed for %s: %s", phone_number, exc)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/api/calls/trigger",
    response_model=CallResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger or schedule an outbound call",
)
async def trigger_call(
    body: CallRequest,
    scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> CallResponse:
    if body.delay_minutes is None:
        # Immediate call
        logger.info("Triggering immediate call to %s (%s)", body.phone_number, body.customer_name)
        data = await vapi_service.trigger_call(body.phone_number, body.customer_name)
        return CallResponse(
            status="initiated",
            message="Call successfully triggered via Vapi.",
            call_id=data.get("id"),
        )

    # Future call — hand off to APScheduler (date trigger = run once)
    run_at = datetime.now(tz=timezone.utc) + timedelta(minutes=body.delay_minutes)
    job = scheduler.add_job(
        _scheduled_call,
        trigger="date",
        run_date=run_at,
        args=[body.phone_number, body.customer_name],
        misfire_grace_time=60,
    )
    logger.info(
        "Call to %s scheduled in %d min at %s (job_id=%s)",
        body.phone_number,
        body.delay_minutes,
        run_at.isoformat(),
        job.id,
    )
    return CallResponse(
        status="scheduled",
        message=f"Call to {body.customer_name} scheduled in {body.delay_minutes} minute(s).",
        scheduled_at=run_at,
    )


@router.post(
    "/api/webhook/vapi",
    status_code=status.HTTP_200_OK,
    summary="Receive Vapi end-of-call report",
)
async def vapi_webhook(payload: WebhookPayload) -> dict:
    """
    Vapi POSTs the end-of-call report here when a call ends.
    Point 'Server URL' in your Vapi dashboard to:
      https://<your-domain>/api/webhook/vapi
    """
    message = payload.message or {}
    call_type   = message.get("type", "unknown")
    call_id     = message.get("call", {}).get("id", "unknown")
    transcript  = message.get("artifact", {}).get("transcript", "")
    summary     = message.get("analysis", {}).get("summary", "")
    end_reason  = message.get("endedReason", "unknown")

    logger.info(
        "Vapi webhook received | type=%s | call_id=%s | ended_reason=%s",
        call_type, call_id, end_reason,
    )
    if transcript:
        logger.info("Transcript:\n%s", transcript)
    if summary:
        logger.info("Summary: %s", summary)

    return {"received": True}


@router.get("/health", summary="Liveness probe")
async def health() -> dict:
    return {"status": "ok"}


@router.get(
    "/api/frontend/call-config",
    response_model=FrontendCallConfig,
    summary="Runtime-safe frontend call config",
)
async def frontend_call_config() -> FrontendCallConfig:
    """
    Exposes only browser-safe fields required by the web call UI.
    Keeps runtime config ownership in backend and avoids NEXT_PUBLIC Vapi secrets in frontend.
    """
    if not settings.web_call_enabled:
        return FrontendCallConfig(web_call_enabled=False)

    return FrontendCallConfig(
        web_call_enabled=True,
        assistant_id=settings.vapi_assistant_id,
        public_key=settings.web_call_public_key,
    )
