"""
call_schemas.py — Pydantic V2 request/response models.
Strict types ensure bad data never reaches the service layer.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class CallRequest(BaseModel):
    phone_number: str = Field(examples=["+919876543210"])
    customer_name: str = Field(examples=["Arjun Sharma"])
    delay_minutes: int | None = Field(
        default=None,
        ge=1,
        le=10080,  # max 1 week
        description="Schedule the call N minutes from now. Omit (or leave null) to call immediately.",
        examples=[5],
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Basic sanity: must start with + (E.164)."""
        stripped = v.strip()
        if not stripped.startswith("+"):
            raise ValueError("phone_number must be in E.164 format, e.g. +919876543210")
        return stripped


class CallResponse(BaseModel):
    status: str
    message: str
    call_id: str | None = None
    scheduled_at: datetime | None = None


class FrontendCallConfig(BaseModel):
    web_call_enabled: bool
    assistant_id: str | None = None
    public_key: str | None = None


class WebhookPayload(BaseModel):
    """
    Accepts the end-of-call report Vapi POSTs to our server URL.
    Using Dict[str, Any] keeps this flexible as Vapi's schema evolves.
    """

    model_config = {"extra": "allow"}

    message: dict[str, Any] | None = None
