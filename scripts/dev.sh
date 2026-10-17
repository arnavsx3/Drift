#!/usr/bin/env bash
set -euo pipefail

DRIFT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$BACKEND_PID" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [[ -n "$FRONTEND_PID" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ ! -d "$DRIFT_ROOT/frontend/node_modules" || ! -d "$DRIFT_ROOT/backend/deps" ]]; then
  echo "Install the project dependencies first: make setup" >&2
  exit 1
fi

echo "Starting Drift at http://127.0.0.1:5173 — press Ctrl+C to stop both servers."
(cd "$DRIFT_ROOT/backend" && exec mix run --no-halt) &
BACKEND_PID=$!
(cd "$DRIFT_ROOT/frontend" && exec node node_modules/vite/bin/vite.js --host 127.0.0.1) &
FRONTEND_PID=$!

# If either server exits, shut down the other instead of leaving an orphan process.
wait -n "$BACKEND_PID" "$FRONTEND_PID"
