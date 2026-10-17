#!/usr/bin/env bash
set -euo pipefail

DRIFT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
ASSETS_PID=""

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$BACKEND_PID" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [[ -n "$ASSETS_PID" ]]; then kill "$ASSETS_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ ! -d "$DRIFT_ROOT/assets/node_modules" || ! -d "$DRIFT_ROOT/backend/deps" ]]; then
  echo "Install the project dependencies first: make setup" >&2
  exit 1
fi

(cd "$DRIFT_ROOT/assets" && npm run build)

echo "Starting Drift at http://127.0.0.1:4000 — press Ctrl+C to stop the server and asset watcher."
(cd "$DRIFT_ROOT/backend" && exec mix run --no-halt) &
BACKEND_PID=$!
(cd "$DRIFT_ROOT/assets" && exec node node_modules/vite/bin/vite.js build --watch) &
ASSETS_PID=$!

# If either server exits, shut down the other instead of leaving an orphan process.
wait -n "$BACKEND_PID" "$ASSETS_PID"
