# Critical Smoke Checklist

Run this checklist in staging before each production release.

## Service liveness and readiness

- [ ] `GET /health` returns `200`.
- [ ] `GET /ready` returns `200`.
- [ ] `GET /debug/ping` returns `200`.

## API baseline

- [ ] Auth-related API endpoints respond correctly.
- [ ] Order-related API endpoints respond correctly.
- [ ] Payment callback endpoint idempotency is verified.
- [ ] Points/wallet endpoints return consistent data.

## Deployment safety

- [ ] Container health status is `healthy`.
- [ ] Logs show no sustained high-severity error.
- [ ] Rollback script was dry-run validated.

## Evidence

- [ ] Smoke execution timestamp is recorded.
- [ ] Operator and commit SHA are recorded.
