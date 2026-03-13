"""
vapi_service.py — Async HTTP client wrapping the Vapi Phone Call API.

Design decisions:
- Single shared httpx.AsyncClient (created at app startup, closed on shutdown)
  avoids per-request TCP handshakes → lower latency.
- Raises HTTPException so the router stays clean.
- assistantOverrides.firstMessage is injected per-call for personalisation.
"""

import logging

import httpx
from fastapi import HTTPException

from src.core.config import settings

logger = logging.getLogger(__name__)

# Module-level client; lifecycle managed by FastAPI lifespan in main.py
_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("HTTP client has not been initialised. Check app lifespan.")
    return _client


def init_client() -> None:
    global _client
    _client = httpx.AsyncClient(
        base_url=settings.vapi_base_url,
        headers={
            "Authorization": f"Bearer {settings.vapi_private_api_key}",
            "Content-Type": "application/json",
        },
        timeout=httpx.Timeout(15.0),  # Vapi SLA is well within this
    )
    logger.info("Vapi HTTP client initialised.")


async def close_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None
        logger.info("Vapi HTTP client closed.")


async def trigger_call(phone_number: str, customer_name: str) -> dict:
    """
    Fire an immediate outbound call via Vapi.
    Returns the raw Vapi response dict on success.
    Raises HTTPException on any transport or API error.
    """
    payload = {
        "assistantId": settings.vapi_assistant_id,
        "phoneNumberId": settings.vapi_phone_number_id,
        "customer": {"number": phone_number},
        "assistantOverrides": {
            "firstMessage": (
                f"Hi {customer_name}! This is the AI customer success team at "
                "Riverwood Projects. Am I speaking with the plot owner?"
            )
        },
    }

    try:
        response = await get_client().post("/call/phone", json=payload)
        response.raise_for_status()
    except httpx.TimeoutException as exc:
        logger.error("Vapi call timeout for %s: %s", phone_number, exc)
        raise HTTPException(status_code=504, detail="Upstream Vapi API timed out.")
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Vapi API error %s for %s: %s",
            exc.response.status_code,
            phone_number,
            exc.response.text,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Vapi API returned {exc.response.status_code}: {exc.response.text}",
        )
    except httpx.RequestError as exc:
        logger.error("Vapi network error for %s: %s", phone_number, exc)
        raise HTTPException(status_code=502, detail=f"Network error reaching Vapi: {exc}")

    data = response.json()
    logger.info("Call initiated successfully. Vapi call_id=%s", data.get("id"))
    return data
