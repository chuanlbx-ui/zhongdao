#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$ENVIRONMENT" ]]; then
  echo "Usage: health-check.sh --env <staging|prod>"
  exit 1
fi

if [[ "$ENVIRONMENT" == "prod" ]]; then
  HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/ready}"
else
  HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/ready}"
fi

MAX_RETRIES="${MAX_RETRIES:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

echo "Checking health endpoint: $HEALTH_URL"
for ((i=1; i<=MAX_RETRIES; i++)); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Health check passed on attempt $i."
    exit 0
  fi
  echo "Attempt $i/$MAX_RETRIES failed. Retrying in $SLEEP_SECONDS seconds..."
  sleep "$SLEEP_SECONDS"
done

echo "Health check failed after $MAX_RETRIES attempts."
exit 1
