# Branch and Release Strategy

## Branch model

- `main`: always releasable, branch protected.
- `feature/*`: short-lived development branches.
- `fix/*`: non-urgent bug fixes.
- `hotfix/*`: urgent production fixes based on latest production tag.

## Merge rules

- No direct push to `main`.
- All changes merge through PR with at least one reviewer.
- Required checks must pass:
  - `CI Quality / API quality gate`
  - `CI Quality / Release readiness checks`
  - `Security Guard / Secret scan`
- Squash merge is preferred for traceable history.

## Versioning

Use semantic version tags:

- `MAJOR`: breaking change.
- `MINOR`: backward-compatible feature.
- `PATCH`: bug fix / operational improvement.

## Hotfix flow

1. Create `hotfix/*` from latest production tag.
2. Implement fix and add regression evidence.
3. Merge to `main`.
4. Deploy patch and update changelog.

## Required repository settings

1. Protect `main` (require PR, review, and status checks).
2. Restrict force-push and branch deletion on `main`.
3. Protect `production` environment approval in GitHub Actions.
