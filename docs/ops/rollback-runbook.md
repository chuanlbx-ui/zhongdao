# Rollback Runbook

## Trigger criteria

- P0/P1 defect in login, order, payment callback, or settlement.
- Sustained high error rate over agreed threshold.
- Data consistency risk detected.

## Steps

1. Identify target environment (`staging` or `prod`).
2. Execute rollback:
   - `bash ops/scripts/rollback.sh --env prod --to previous`
3. Run health check:
   - `bash ops/scripts/health-check.sh --env prod`
4. Record rollback details in incident report.

## Recovery follow-up

- Freeze new deployments until root cause is documented.
- Add at least one regression test before next release.
