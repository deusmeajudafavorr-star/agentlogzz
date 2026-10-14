#!/usr/bin/env bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Instale o Node.js 18+ (https://nodejs.org)"; exit 1; }
[ -d node_modules ] || npm install --no-audit --no-fund
node server.js
