# Stability Playbook

This playbook defines the baseline process for stable delivery in this public operations repository.

## Daily workflow

1. Create a short-lived branch from `main` (`feature/*`, `fix/*`, `hotfix/*`).
2. Keep each PR focused and small.
3. Run local checks before opening PR:
   - `npm run quality:check`
4. Fill PR template with risk, verification steps, and rollback plan.

## Regression discipline

- Every production bug must include:
  - Root-cause note.
  - At least one automated regression test (API or script-level).
  - Changelog update under `[Unreleased]`.

## Release discipline

- Follow `docs/governance/release-checklist.md`.
- Execute `docs/governance/critical-smoke-checklist.md` before production deployment.
- If rollback criteria are met, rollback first and diagnose second.

## Core commands

- Full gate: `npm run quality:check`
- API gate: `npm run quality:api`
- Security scan: `npm run security:scan`
- Release-readiness: `npm run release:validate`
