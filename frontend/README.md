# Riverwood Frontend

This frontend is intentionally UI-first and thin.

- It renders the user experience and visual state.
- It delegates call triggering and runtime configuration to the FastAPI backend.
- It only requires one browser env var: `NEXT_PUBLIC_BACKEND_URL`.

## Architecture Boundary

- `frontend/lib/backend-api.ts`: Single transport layer for backend calls.
- `frontend/components/*`: UI and local interaction state.
- `frontend/hooks/useVapi.ts`: Browser-only Web SDK orchestration for live web calls.
- No private Vapi credentials are stored in frontend env files.

## Environment

Copy the example file and adjust as needed:

```bash
cp .env.example .env.local
```

Example value:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.
