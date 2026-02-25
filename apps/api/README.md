# API Minimal Runtime

This service is intentionally minimal for deployment validation in a public repository.

## Endpoints

- `GET /health`: liveness check.
- `GET /ready`: readiness check.
- `GET /debug/ping`: debug ping endpoint.

## Local run

1. Copy `../../config/env/.env.example` to a local `.env` file (not tracked).
2. Install dependencies: `npm install`.
3. Run dev server: `npm run dev`.
