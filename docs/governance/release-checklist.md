# Release Checklist

Use this checklist before every production deployment.

## 1) Pre-merge (PR gate)

- [ ] PR template fields are complete.
- [ ] Linked bug/regression issue exists when applicable.
- [ ] API contract impact is documented (`apps/api/docs/openapi.yaml`).
- [ ] `npm run quality:check` passes in repository root.
- [ ] Changelog entry is prepared under `[Unreleased]`.

## 2) Pre-release (staging gate)

- [ ] Release branch/tag is created (`vMAJOR.MINOR.PATCH`).
- [ ] Database migration and rollback plan reviewed.
- [ ] Critical smoke checklist passes in staging.
- [ ] Rollback owner and command are confirmed.

## 3) Production release

- [ ] Run deployment workflow with approved input tag.
- [ ] Validate `/health`, `/ready`, `/debug/ping`.
- [ ] Monitor error rate and core service metrics for 30-60 minutes.
- [ ] Record deployment SHA, operator, and release timestamp.

## 4) Rollback criteria

Rollback immediately if any condition is true:

- P0/P1 issue in authentication, order, payment callback, or settlement APIs.
- Error rate exceeds agreed threshold for 10+ minutes.
- Data inconsistency risk is detected.

## 5) Post-release tasks

- [ ] Move changelog items from `[Unreleased]` to a released version section.
- [ ] Add incident notes if rollback/hotfix happened.
- [ ] Add at least one automated regression test for each production bug.
