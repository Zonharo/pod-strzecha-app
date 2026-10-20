#!/bin/sh
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.docker/bin:$PATH"
export HOST_IP="${HOST_IP:-$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)}"
exec docker compose run --rm -T app "$@"
