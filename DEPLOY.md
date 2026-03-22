# Despliegue en VPS — Adventure Engine

Guía completa para tener la app corriendo en un VPS Linux con
Next.js + PM2 + Nginx + SQLite + HTTPS.

---

## FASE A — Requisitos y decisiones

### Checklist del VPS antes de empezar

```
Sistema operativo:  Ubuntu 22.04 LTS  (recomendado)
RAM mínima:         1 GB  (2 GB recomendado)
Disco:              10 GB libres mínimo
Node.js:            v20 LTS  (instalar con nvm, ver abajo)
npm:                v10+  (viene con Node 20)
PM2:                instalado globalmente
Nginx:              instalado desde apt
Git:                instalado desde apt
Certbot:            instalado desde snap (para HTTPS)
Usuario:            no root con sudo  (ej: deploy)
Firewall:           puertos 22, 80, 443 abiertos
```

### Rutas en el servidor

```
/var/www/adventure-engine/          ← raíz del proyecto
/var/www/adventure-engine/data/     ← base de datos SQLite (persiste entre deploys)
/var/log/pm2/                       ← logs de la app
/etc/nginx/sites-available/         ← config de Nginx
```

### Variables de entorno requeridas

| Variable | Valor en producción | Notas |
|---|---|---|
| `NODE_ENV` | `production` | Activa validaciones de seguridad |
| `PORT` | `3000` | Puerto interno. Nginx hace proxy aquí |
| `DATABASE_URL` | `/var/www/adventure-engine/data/adventure.db` | Ruta absoluta obligatoria en prod |

---

## FASE B — Instalación inicial del servidor

### 1. Preparar el servidor (una sola vez)

```bash
# Conectar al VPS
ssh usuario@IP_DEL_VPS

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
sudo apt install -y git nginx curl

# Instalar nvm (gestor de versiones de Node)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node --version   # v20.x.x
npm --version    # 10.x.x

# Instalar PM2 globalmente
npm install -g pm2

# Crear directorio del proyecto
sudo mkdir -p /var/www/adventure-engine/data
sudo chown -R $USER:$USER /var/www/adventure-engine

# Crear directorio de logs de PM2
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### 2. Subir el código al servidor

Opción A — Git (recomendado para deploys repetibles):
```bash
# En el servidor
cd /var/www
git clone https://github.com/tu-usuario/adventure-engine.git
cd adventure-engine
```

Opción B — rsync desde tu máquina local:
```bash
# Desde tu máquina local (excluye node_modules y .next)
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '*.db' \
  ./ usuario@IP_DEL_VPS:/var/www/adventure-engine/
```

### 3. Configurar variables de entorno

```bash
# En el servidor, dentro de /var/www/adventure-engine
cp .env.example .env.production

# Editar con los valores reales
nano .env.production
```

Contenido de `.env.production`:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=/var/www/adventure-engine/data/adventure.db
```

### 4. Primer despliegue completo

```bash
cd /var/www/adventure-engine

# Instalar dependencias de producción
npm ci --omit=dev

# Generar y aplicar migraciones (crea adventure.db si no existe)
npm run db:migrate

# Build de Next.js para producción
npm run build

# Arrancar con PM2
pm2 start ecosystem.config.js --env production

# Guardar la lista de procesos (para que PM2 arranque solo al reiniciar el VPS)
pm2 save

# Configurar PM2 para arrancar con el sistema
pm2 startup
# → ejecuta el comando que te devuelve este comando (empieza por "sudo")
```

Verificar que está corriendo:
```bash
pm2 list
pm2 logs adventure-engine --lines 20
curl http://localhost:3000   # debe devolver HTML
```

### 5. Configurar Nginx

```bash
# Copiar la config de Nginx
sudo cp /var/www/adventure-engine/deploy/nginx.conf \
        /etc/nginx/sites-available/adventure-engine

# Editar el server_name con tu dominio real
sudo nano /etc/nginx/sites-available/adventure-engine
# Cambia: server_name tudominio.com www.tudominio.com;

# Activar el site
sudo ln -s /etc/nginx/sites-available/adventure-engine \
           /etc/nginx/sites-enabled/adventure-engine

# Desactivar el site por defecto si no lo necesitas
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

Verificar:
```bash
curl http://tudominio.com   # debe devolver HTML de la app
```

### 6. Activar HTTPS con Let's Encrypt

```bash
# Instalar Certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtener certificado y que Certbot reescriba nginx.conf automáticamente
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

Después de Certbot, la app es accesible en `https://tudominio.com`.

---

## FASE B — Despliegues posteriores (repetibles)

Cada vez que actualices el código, ejecuta esto en el servidor:

```bash
cd /var/www/adventure-engine

# Si usas Git:
git pull origin main

# Si usas rsync: sube los archivos primero, luego:
bash deploy/deploy.sh
```

El script `deploy.sh` hace en orden:
1. Verifica que `.env.production` existe
2. `npm ci --omit=dev`
3. `npm run db:migrate`
4. `npm run build`
5. `pm2 reload` (zero-downtime)

---

## Comandos útiles de PM2

```bash
pm2 list                          # ver todos los procesos
pm2 logs adventure-engine         # logs en tiempo real
pm2 logs adventure-engine --lines 100   # últimas 100 líneas
pm2 restart adventure-engine      # reinicio completo (hay downtime breve)
pm2 reload adventure-engine       # recarga sin downtime
pm2 stop adventure-engine         # parar
pm2 delete adventure-engine       # eliminar proceso de PM2
pm2 monit                         # monitor visual en terminal
```

---

## Comandos de base de datos

```bash
# Aplicar migraciones nuevas
cd /var/www/adventure-engine
npm run db:migrate

# Inspeccionar la BD con Drizzle Studio (requiere abrir puerto temporal)
# Solo para debug puntual, no dejar corriendo en producción
npm run db:studio

# Backup manual de la BD
cp /var/www/adventure-engine/data/adventure.db \
   /var/www/adventure-engine/data/adventure.db.backup-$(date +%Y%m%d)
```

---

## FASE C — Verificaciones de producción

### SQLite en ruta persistente

La BD vive en `/var/www/adventure-engine/data/adventure.db`.
Este directorio **no se toca** en ningún paso del deploy (git pull, npm build, etc.).
El script `deploy.sh` lo crea si no existe pero nunca lo borra.

Verificar:
```bash
ls -lh /var/www/adventure-engine/data/
# adventure.db debe aparecer con un tamaño > 0
```

### Next.js detrás de Nginx

`next.config.ts` tiene `trustHostHeader: true` para que Next.js confíe
en los headers `X-Forwarded-*` que Nginx añade. Sin esto, algunas
redirecciones o detecciones de protocolo HTTPS fallarían.

Verificar:
```bash
# Desde fuera del servidor:
curl -I https://tudominio.com/api/users
# Debe devolver HTTP/2 200 y Content-Type: application/json
```

### Sin dependencias de localhost

Todos los endpoints usan rutas relativas (`/api/users`, `/api/progress/:id`).
Next.js resuelve estas llamadas internamente en el servidor (server components)
o desde el browser (client components). Ningún fetch apunta a `localhost:3000`
en el código de la app.

La única referencia a `127.0.0.1:3000` está en `nginx.conf` (línea `proxy_pass`),
que es correcta y esperada.

---

## Estructura final en el servidor

```
/var/www/adventure-engine/
├── .env.production              ← NO en git, valores reales
├── .next/                       ← build de producción (generado por npm run build)
├── content/adventures/          ← JSONs de aventuras
├── data/
│   └── adventure.db             ← base de datos SQLite (persiste siempre)
├── node_modules/                ← dependencias (npm ci)
├── src/
├── ecosystem.config.js
├── deploy/
│   ├── deploy.sh
│   └── nginx.conf
└── package.json
```

---

## Resolución de problemas frecuentes

**La app no arranca tras el deploy**
```bash
pm2 logs adventure-engine --lines 50
# Busca el error específico en los últimos logs
```

**"DATABASE_URL debe ser una ruta absoluta"**
```bash
cat .env.production | grep DATABASE_URL
# Asegúrate de que empieza por /var/www/...
```

**Nginx devuelve 502 Bad Gateway**
```bash
pm2 list              # verificar que adventure-engine está online
curl localhost:3000   # verificar que Next.js responde directamente
sudo nginx -t         # verificar config de Nginx
```

**Los cambios del JSON de aventura no se reflejan**
El `content-loader` cachea el JSON en memoria. Basta con recargar PM2:
```bash
pm2 reload adventure-engine
```

**Base de datos bloqueada (SQLITE_BUSY)**
Ocurre si hay dos procesos intentando escribir a la vez.
Con `instances: 1` en `ecosystem.config.js` no debe ocurrir.
Si aparece, verificar que no hay otro proceso Node corriendo:
```bash
pm2 list
lsof /var/www/adventure-engine/data/adventure.db
```
