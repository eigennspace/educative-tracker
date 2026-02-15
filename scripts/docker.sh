#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-up}"

case "$ACTION" in
  up)
    docker compose up -d --build
    ;;
  up-prod)
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ;;
  down)
    docker compose down
    ;;
  down-prod)
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    ;;
  restart)
    docker compose down
    docker compose up -d --build
    ;;
  restart-prod)
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ;;
  logs)
    docker compose logs -f --tail=200
    ;;
  logs-prod)
    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200
    ;;
  ps)
    docker compose ps
    ;;
  ps-prod)
    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
    ;;
  *)
    echo "Usage: scripts/docker.sh [up|up-prod|down|down-prod|restart|restart-prod|logs|logs-prod|ps|ps-prod]"
    exit 1
    ;;
esac
