# Security Policy

## Supported scope

This repository is public and contains deployment/runtime assets only.
Do not submit real credentials in issues or pull requests.

## Reporting

Please report security concerns privately to the maintainers.

## Secret handling policy

- Real credentials must only exist in GitHub Secrets or server environment variables.
- `.env` files with real values are forbidden in commits.
- CI secret scans are required checks for all pull requests.
