#!/bin/bash
# deploy/deploy.sh
# ─────────────────────────────────────────────────────────────────
# Script de despliegue repetible para el VPS.
# Ejecutar desde la raíz del proyecto en el servidor:
#   bash deploy/deploy.sh
#
# Lo que hace:
#   1. Instala dependencias de producción
#   2. Corre migraciones de base de datos
#   3. Compila Next.js para producción
#   4. Recarga PM2 sin downtime
# ─────────────────────────────────────────────────────────────────

set -e  # salir inmediatamente si cualquier comando falla

APP_DIR="/var/www/adventure-engine"
DATA_DIR="$APP_DIR/data"
LOG_DIR="/var/log/pm2"

echo ""
echo "▶ Adventure Engine — deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "──────────────────────────────────────────────────────────"

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "✗ Error: no se encontró package.json en $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

# 2. Asegurar directorio de datos y logs
echo "→ Creando directorios necesarios..."
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"

# 3. Cargar variables de entorno de producción
if [ ! -f ".env.production" ]; then
  echo "✗ Error: no existe .env.production"
  echo "  Copia .env.example → .env.production y rellena los valores"
  exit 1
fi

export $(grep -v '^#' .env.production | xargs)

# 4. Instalar dependencias (solo producción)
echo "→ Instalando dependencias..."
npm ci --omit=dev

# 5. Correr migraciones
echo "→ Ejecutando migraciones de base de datos..."
npm run db:migrate

# 6. Build de Next.js
echo "→ Compilando Next.js para producción..."
npm run build

# 7. Recargar PM2 (zero-downtime si ya corre, start si no)
echo "→ Recargando PM2..."
if pm2 describe adventure-engine > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
  pm2 save  # persiste la lista de procesos para reboot
fi

echo ""
echo "✓ Deploy completado"
echo "──────────────────────────────────────────────────────────"
pm2 list
