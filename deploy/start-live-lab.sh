#!/usr/bin/env bash
# Local production-style run: Express + Python FGSM/PGD sidecar.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Create .env.local from .env.example first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

export NODE_ENV=production
export EVAL_API_URL="${EVAL_API_URL:-http://127.0.0.1:8001}"
export GEMINI_MODEL="${GEMINI_MODEL:-gemini-3.5-flash}"

if [[ -z "${LAB_BASIC_USER:-}" || -z "${LAB_BASIC_PASS:-}" ]]; then
  echo "LAB_BASIC_USER and LAB_BASIC_PASS must be set (fail-closed production)." >&2
  exit 1
fi

mkdir -p "$ROOT/.run"
echo "$$" > "$ROOT/.run/start-live-lab.pid"

if [[ ! -f dist/server.cjs ]]; then
  npm run build
fi

python3 eval/adversarial/service.py >"$ROOT/.run/eval.log" 2>&1 &
echo $! > "$ROOT/.run/eval.pid"

# Wait until the sidecar answers health (or 45s).
for _ in $(seq 1 45); do
  if curl -sf "http://127.0.0.1:8001/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

exec node dist/server.cjs
