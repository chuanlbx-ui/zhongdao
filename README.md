# zhongdao

Public operations and deployment repository for Zhongdao.

## Repository purpose

- Keep only deployment, operations, monitoring, and minimal API runtime code.
- Keep governance artifacts (quality gates, release checklist, branch strategy).
- Prevent any sensitive server/database credentials from entering Git history.

## Quick structure

- `apps/api`: minimal API runtime used for health/readiness and debugging.
- `ops/compose`: Docker Compose manifests for staging and production.
- `ops/scripts`: deploy/rollback/health-check scripts.
- `ops/monitoring`: log monitoring and analysis scripts.
- `config/env`: environment templates and schema.
- `docs/governance`: stability and release governance documents.

## Local bootstrap

1. Copy `config/env/.env.example` to your local secret file (not tracked).
2. Install root dependencies: `npm install`.
3. Install API dependencies: `npm --prefix apps/api install`.
4. Run quality gate: `npm run quality:check`.

## Security baseline

- Never commit real `.env` files.
- Use GitHub Secrets + server runtime env injection.
- CI runs secret scan and release-readiness checks on every PR.
