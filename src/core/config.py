"""
config.py — Central configuration via pydantic-settings.
Reads from environment variables / .env file at startup.
Fails fast if required vars are missing (no silent fallbacks).
"""

import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Vapi credentials — required; no default so startup fails loudly if absent
    vapi_private_api_key: str
    vapi_assistant_id: str
    vapi_phone_number_id: str  # ID of the outbound phone number in your Vapi dashboard
    # Optional public key for browser Web SDK sessions.
    vapi_public_api_key: str | None = None

    # Operational
    vapi_base_url: str = "https://api.vapi.ai"
    log_level: str = "INFO"
    # Keep this as string to avoid pydantic-settings JSON pre-parse errors.
    # Accepts comma-separated values or JSON array string.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        raw = (self.cors_origins or "").strip()
        if not raw:
            return []

        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                # Fall back to comma-split parsing below.
                pass

        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def web_call_public_key(self) -> str | None:
        value = (self.vapi_public_api_key or "").strip()
        if not value:
            return None
        if value.lower() == "undefined" or value.startswith("your_"):
            return None
        return value

    @property
    def web_call_enabled(self) -> bool:
        return self.web_call_public_key is not None


# Singleton — imported everywhere; evaluated once at import time
settings = Settings()
