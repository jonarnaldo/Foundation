#!/usr/bin/env bash
set -euo pipefail

CONTAINER=$(docker ps --filter "name=foundation-core" --format "{{.Names}}" | head -1)

docker exec -it -u vscode -w /workspaces/Foundation "$CONTAINER" /bin/bash
