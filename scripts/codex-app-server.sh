#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

LISTEN_URL="${CODEX_APP_SERVER_LISTEN_URL:-ws://127.0.0.1:8765}"
NODE_BIN="${CODEX_APP_SERVER_NODE_BIN:-$(command -v node || true)}"
CODEX_BIN="${CODEX_APP_SERVER_BIN:-}"

if [[ -z "$CODEX_BIN" ]]; then
  for candidate in \
    /opt/homebrew/lib/node_modules/@openai/codex/bin/codex.js \
    /usr/local/lib/node_modules/@openai/codex/bin/codex.js
  do
    if [[ -f "$candidate" ]]; then
      CODEX_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "找不到 node，可用 CODEX_APP_SERVER_NODE_BIN 指定。" >&2
  exit 1
fi

if [[ -z "$CODEX_BIN" || ! -f "$CODEX_BIN" ]]; then
  echo "找不到 Codex JS 入口，可用 CODEX_APP_SERVER_BIN 指定。" >&2
  exit 1
fi

cd "$PROJECT_ROOT"
exec "$NODE_BIN" "$CODEX_BIN" app-server --listen "$LISTEN_URL"
