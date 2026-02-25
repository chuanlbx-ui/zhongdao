# Deployment Runbook

## 1) Preconditions

- GitHub branch protection is active on `main`.
- Required secrets exist: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`.
- Environment variables are prepared on target server.

## 2) Staging deployment

1. Trigger workflow `Deploy Production` with `target_env=staging`.
2. Verify health: `bash ops/scripts/health-check.sh --env staging`.
3. Execute critical smoke checklist.

## 3) Production deployment

1. Trigger workflow `Deploy Production` with `target_env=prod`.
2. Verify readiness endpoint and key business APIs.
3. Observe metrics and error logs for 30-60 minutes.

## 4) Failure handling

- If health-check fails, trigger rollback immediately.
- Keep incident record with timestamp, operator, SHA, and rollback result.
