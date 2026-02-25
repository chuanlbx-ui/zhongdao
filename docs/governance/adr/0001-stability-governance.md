# ADR 0001: Regression-First Stability Governance

## Status
Accepted

## Context

This repository is public and focused on deployment/runtime governance.
Operational changes can still break production if CI, release checks, or secret controls are weak.

Current risks:

- Deployment scripts can drift from production reality.
- Secret leakage risk increases in a public repository.
- Incomplete release evidence slows incident response.

## Decision

Adopt a mandatory governance baseline:

1. Enforce CI quality and release-readiness checks on every PR.
2. Enforce secret scanning in local scripts and CI.
3. Keep critical smoke checklist and rollback runbook versioned.
4. Require changelog and incident records for production-impacting changes.
5. Protect `main` and deployment environments.

## Consequences

Positive:

- Lower production regression risk.
- Better compliance posture for a public repo.
- Faster rollback and clearer incident accountability.

Tradeoffs:

- Extra process overhead before merging/deploying.
- More maintenance needed for docs and workflows.

## Rollout Plan

1. Enable required checks in branch protection.
2. Keep deployment workflow behind protected environments.
3. Validate runbooks in staging before production rollout.
4. Review governance docs monthly and after each incident.
