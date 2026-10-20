#!/bin/sh
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.docker/bin:$PATH"
export HOST_IP="${HOST_IP:-$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)}"
running="$(docker ps -q --filter label=com.docker.compose.project=pod_strzecha_app --filter publish=8081)"
if [ -n "$running" ]; then
  echo "Zatrzymuję poprzednie Metro"
  docker stop $running >/dev/null
fi
echo "Expo Go: exp://$HOST_IP:8081"
exec docker compose run --rm --service-ports app npx expo start --lan "$@"
