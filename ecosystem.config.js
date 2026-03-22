// ecosystem.config.js
// PM2 process manager configuration for production VPS deployment.
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 restart adventure-engine
//   pm2 reload adventure-engine   ← zero-downtime reload
//   pm2 stop adventure-engine

module.exports = {
  apps: [
    {
      name: 'adventure-engine',

      // Entry point: Next.js production server
      script: 'node_modules/.bin/next',
      args: 'start',

      // Working directory: root of the project on the VPS
      cwd: '/var/www/adventure-engine',

      // How many instances to run.
      // 1 = simple, safe for SQLite (no concurrent write contention).
      // If you switch to Postgres in v2, set to 'max' for cluster mode.
      instances: 1,
      exec_mode: 'fork',

      // Automatically restart on crash
      autorestart: true,
      watch: false,           // never watch in production
      max_restarts: 10,
      min_uptime: '5s',       // must stay alive 5s to count as a successful start

      // Memory guard: restart if over 512MB (Next.js is typically ~80–150MB)
      max_memory_restart: '512M',

      // Environment — production values.
      // DATABASE_URL uses an absolute path so SQLite is never relative to cwd.
      // Copy .env.example → .env.production and fill in real values.
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: '/var/www/adventure-engine/data/adventure.db',
      },

      // Logging
      out_file: '/var/log/pm2/adventure-engine-out.log',
      error_file: '/var/log/pm2/adventure-engine-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
