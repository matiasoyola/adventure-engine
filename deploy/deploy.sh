#!/bin/bash
set -e

APP_DIR="/var/www/adventure-engine"
DATA_DIR="$APP_DIR/data"
LOG_DIR="/var/log/pm2"

echo ""
echo "▶ Adventure Engine — deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "──────────────────────────────────────────────────────────"

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "✗ Error: no se encontró package.json en $APP_DIR"; exit 1
fi

cd "$APP_DIR"
mkdir -p "$DATA_DIR" "$LOG_DIR"

if [ ! -f ".env.production" ]; then
  echo "✗ Error: no existe .env.production"
  echo "  Copia .env.example → .env.production y rellena los valores"; exit 1
fi

export $(grep -v '^#' .env.production | xargs)

echo "→ Instalando dependencias..."
npm ci --omit=dev

echo "→ Ejecutando migraciones..."
npm run db:migrate

echo "→ Compilando Next.js..."
npm run build

echo "→ Recargando PM2..."
if pm2 describe adventure-engine > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

echo ""
echo "✓ Deploy completado"
echo "──────────────────────────────────────────────────────────"
pm2 list
