#!/bin/sh
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.docker/bin:$PATH"
if [ -t 0 ]; then
  exec docker compose run --rm app node scripts/kasa.mjs "$@"
fi
exec docker compose run --rm -T app node scripts/kasa.mjs "$@"
