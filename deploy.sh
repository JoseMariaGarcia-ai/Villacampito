#!/usr/bin/env bash
# deploy.sh — Villa Campito
#
# Vuelve a desplegar el sitio tras un cambio de código. Ejecutar en el VPS,
# dentro de la carpeta del proyecto (donde está este archivo):
#
#   ./deploy.sh
#
# Hace: git pull -> reconstruir y reiniciar contenedores -> aplicar
# migraciones de base de datos pendientes (si las hay).

set -euo pipefail
cd "$(dirname "$0")"

echo "==> Actualizando código (git pull)..."
git pull

echo "==> Reconstruyendo y reiniciando contenedores..."
docker compose up -d --build

echo "==> Aplicando migraciones de base de datos (si hay nuevas)..."
docker compose exec -T app pnpm exec drizzle-kit migrate

echo "==> Listo. Estado de los contenedores:"
docker compose ps
