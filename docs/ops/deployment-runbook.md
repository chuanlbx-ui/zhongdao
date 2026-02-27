# Deployment Runbook

## 1) Preconditions

- `main` branch protection is active.
- GitHub self-hosted runner is installed on the deployment server.
- Runner labels include: `self-hosted`, `linux`, `zhongdao-deploy`.
- Repository secret `DEPLOY_PATH` exists.
- Server-local env files exist:
  - `${DEPLOY_PATH}/config/env/.env.staging`
  - `${DEPLOY_PATH}/config/env/.env.prod`
- Docker Engine and Docker Compose plugin are installed on the server.

## 2) How deployment communication works

- GitHub-hosted runners cannot access internal network addresses like `172.16.x.x`.
- This repository uses a **self-hosted runner** on the internal server.
- The server pulls jobs from GitHub (outbound HTTPS), then runs deployment commands locally.
- No inbound SSH from GitHub to internal IP is required.

## 3) Staging deployment

1. Open Actions -> `Deploy Production`.
2. Click `Run workflow` with:
   - `target_env=staging`
   - `image_tag=<tag>`
3. Wait for success.
4. Verify:
   - `bash ops/scripts/health-check.sh --env staging`
   - Critical smoke checklist.

## 4) Production deployment

1. Trigger workflow with:
   - `target_env=prod`
   - `image_tag=<tag>`
2. Verify readiness endpoint and key APIs.
3. Observe metrics and logs for 30-60 minutes.

## 5) Failure handling

- If health-check fails, rollback is auto-triggered by workflow.
- If issue is detected after workflow success, run:
  - `bash ops/scripts/rollback.sh --env prod --to previous`
- Record incident with timestamp, operator, SHA, and rollback result.
