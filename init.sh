#!/usr/bin/env bash
set -euo pipefail

# Foundation — Development Environment Setup
# Run this script to install dependencies and start the dev servers.

FRONTEND_PORT=5173
BACKEND_PORT=3001

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "  Foundation — Construction Finance Platform"
echo "================================================"

# ── Prerequisites check ──────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found — installing..."; npm install -g pnpm; }

# ── Clear stale processes on dev ports ───────────────────────────────────────
for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  PID=$(lsof -ti ":$PORT" 2>/dev/null) && kill "$PID" 2>/dev/null && echo "  Cleared stale process on port $PORT (PID $PID)" || true
done

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "[1/3] Installing frontend dependencies..."
cd "$SCRIPT_DIR/client"
pnpm install
echo "  ✓ Frontend dependencies installed"

# ── Backend ───────────────────────────────────────────────────────────────────
echo ""
echo "[2/3] Installing backend dependencies..."
cd "$SCRIPT_DIR/server"
pnpm install
echo "  ✓ Backend dependencies installed"

# ── Database (PostgreSQL + Redis) ─────────────────────────────────────────────
echo ""
echo "[3/3] Starting backend services..."

if command -v docker >/dev/null 2>&1; then
  echo "  Starting PostgreSQL and Redis via Docker Compose..."
  cd "$SCRIPT_DIR"
  docker compose up -d postgres redis 2>/dev/null || docker-compose up -d postgres redis
  echo "  ✓ PostgreSQL (port 5432) and Redis (port 6379) started"

  echo "  Running database migrations..."
  cd "$SCRIPT_DIR/server"
  pnpm run migration:run 2>/dev/null || echo "  (migrations will run automatically on server start)"
else
  echo "  WARNING: Docker not found. Ensure PostgreSQL (port 5432) and Redis (port 6379)"
  echo "           are running manually before starting the backend."
fi

# ── Start Dev Servers ─────────────────────────────────────────────────────────
echo ""
echo "Starting development servers..."

# Backend (NestJS) in the background
cd "$SCRIPT_DIR/server"
pnpm run start:dev &
BACKEND_PID=$!
echo "  ✓ Backend NestJS server starting (PID: $BACKEND_PID)"

# Frontend (Vite) in the background
cd "$SCRIPT_DIR/client"
VITE_PORT=$FRONTEND_PORT pnpm run dev &
FRONTEND_PID=$!
echo "  ✓ Frontend Vite server starting (PID: $FRONTEND_PID)"

# ── Access Info ───────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  Access the application:"
echo "    Frontend : http://localhost:${FRONTEND_PORT}"
echo "    API      : http://localhost:${BACKEND_PORT}/api"
echo "    API Docs : http://localhost:${BACKEND_PORT}/api/docs"
echo ""
echo "  Environment variables required:"
echo "    ANTHROPIC_API_KEY  — path: /tmp/api-key"
echo "    DATABASE_URL       — PostgreSQL connection string"
echo "    REDIS_URL          — Redis connection string"
echo "    PLAID_CLIENT_ID    — Plaid API credentials"
echo "    PLAID_SECRET       — Plaid API credentials"
echo "    AUTH0_DOMAIN       — Auth0 tenant domain"
echo "    AUTH0_CLIENT_ID    — Auth0 application client ID"
echo "    AUTH0_CLIENT_SECRET"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo "================================================"

# Wait for both background processes
wait $BACKEND_PID $FRONTEND_PID
