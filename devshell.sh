#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
CONTAINER=$(docker ps --filter "name=foundation_core" --format "{{.Names}}" | head -1)

if [[ -z "$CONTAINER" ]]; then
  echo "Error: no running foundation_core dev container found" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file '$ENV_FILE' not found" >&2
  exit 1
fi

echo "Connecting to $CONTAINER with env from $ENV_FILE..."
docker exec -it --env-file "$ENV_FILE" -w /workspaces/Foundation "$CONTAINER" /bin/bash
