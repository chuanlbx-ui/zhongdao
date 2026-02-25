#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=""
IMAGE_TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$ENVIRONMENT" || -z "$IMAGE_TAG" ]]; then
  echo "Usage: deploy.sh --env <staging|prod> --image-tag <tag>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
mkdir -p "$ROOT_DIR/ops/.state"

if [[ "$ENVIRONMENT" == "prod" ]]; then
  COMPOSE_FILE="$ROOT_DIR/ops/compose/docker-compose.prod.yml"
  DEFAULT_ENV_FILE="$ROOT_DIR/config/env/.env.prod.example"
else
  COMPOSE_FILE="$ROOT_DIR/ops/compose/docker-compose.staging.yml"
  DEFAULT_ENV_FILE="$ROOT_DIR/config/env/.env.staging.example"
fi

API_ENV_FILE="${API_ENV_FILE:-$DEFAULT_ENV_FILE}"
STATE_FILE="$ROOT_DIR/ops/.state/${ENVIRONMENT}.last_tag"
CURRENT_TAG_FILE="$ROOT_DIR/ops/.state/${ENVIRONMENT}.current_tag"

if [[ -f "$CURRENT_TAG_FILE" ]]; then
  cp "$CURRENT_TAG_FILE" "$STATE_FILE"
fi

echo "$IMAGE_TAG" > "$CURRENT_TAG_FILE"

echo "Deploying $ENVIRONMENT with image tag: $IMAGE_TAG"
IMAGE_TAG="$IMAGE_TAG" API_ENV_FILE="$API_ENV_FILE" docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Deployment command completed."
