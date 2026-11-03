#!/usr/bin/env bash
# One-shot: install deps and start InsightFlow on this machine.
# Usage:  chmod +x run-lab.sh && ./run-lab.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "MISSING: $1"
    echo "Install Node 22 from https://nodejs.org and Python 3.10+ from https://www.python.org"
    echo "Then open a NEW Terminal and run this script again."
    exit 1
  fi
}

need node
need npm
need python3

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "Node $(node -v) is too old. Install Node 22 from https://nodejs.org"
  exit 1
fi

if [[ ! -f package.json ]] || [[ ! -f eval/adversarial/service.py ]]; then
  echo "This script must sit in the InsightFlow project folder (next to package.json)."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo
  echo "Created .env.local from the example."
  echo "Login user/password are the LAB_BASIC_USER and LAB_BASIC_PASS lines in that file."
  echo "You can change them in TextEdit. Gemini key is optional."
  echo
fi

# Load the same secrets the Node app reads, so the Python sidecar matches EVAL_INTERNAL_TOKEN.
set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [[ -z "${LAB_BASIC_USER:-}" || -z "${LAB_BASIC_PASS:-}" ]]; then
  echo ".env.local must set LAB_BASIC_USER and LAB_BASIC_PASS. Copy .env.example and fill them in."
  exit 1
fi

echo "==> npm install (first time can take a few minutes)"
npm install

if [[ ! -d .venv ]]; then
  echo "==> creating Python virtualenv .venv"
  python3 -m venv .venv
fi
echo "==> pip install (PyTorch is big; first time can take 5–15 minutes)"
".venv/bin/python" -m pip install --upgrade pip
".venv/bin/python" -m pip install -r eval/requirements.txt

mkdir -p .run
if [[ -f .run/eval.pid ]] && kill -0 "$(cat .run/eval.pid)" 2>/dev/null; then
  echo "==> attack service already running (pid $(cat .run/eval.pid))"
else
  echo "==> starting attack service on port 8001"
  (
    cd eval/adversarial
    "$ROOT/.venv/bin/python" service.py
  ) >.run/eval.log 2>&1 &
  echo $! > .run/eval.pid
fi

cleanup() {
  if [[ -f .run/eval.pid ]]; then
    kill "$(cat .run/eval.pid)" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> waiting for http://127.0.0.1:8001/health"
ok=0
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:8001/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done
if [[ "$ok" -ne 1 ]]; then
  echo "Attack service did not start. Last log lines:"
  tail -n 40 .run/eval.log || true
  exit 1
fi

echo
echo "Open  http://localhost:3000"
echo "Sign in with LAB_BASIC_USER / LAB_BASIC_PASS from the file .env.local in this folder."
echo "Leave this window open. Ctrl+C stops the lab."
echo "First click of Simulate can be slow (downloads CIFAR-10 once)."
echo

npm run dev
