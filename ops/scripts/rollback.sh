#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=""
TARGET_TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --to)
      TARGET_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$ENVIRONMENT" || -z "$TARGET_TAG" ]]; then
  echo "Usage: rollback.sh --env <staging|prod> --to <tag|previous>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$ROOT_DIR/ops/.state/${ENVIRONMENT}.last_tag"

if [[ "$TARGET_TAG" == "previous" ]]; then
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "No previous tag recorded for $ENVIRONMENT."
    exit 1
  fi
  TARGET_TAG="$(cat "$STATE_FILE")"
fi

echo "Rolling back $ENVIRONMENT to tag: $TARGET_TAG"
bash "$ROOT_DIR/ops/scripts/deploy.sh" --env "$ENVIRONMENT" --image-tag "$TARGET_TAG"
