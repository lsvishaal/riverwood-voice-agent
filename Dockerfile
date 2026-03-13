# ── Stage 1: builder ──────────────────────────────────────────────────────────
# Use a uv-derived image so we don't need a separate COPY --from step.
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# Enable bytecode compilation for faster cold starts in prod
ENV UV_COMPILE_BYTECODE=1
# Use copy mode (not hard-links) across the cache mount boundary
ENV UV_LINK_MODE=copy

# Install dependencies first (cache-friendly layer — only re-runs on lockfile change)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev

# Copy source and install the project itself
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

# Copy only the virtual environment — no build tools in the final image
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src   /app/src

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=0

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
