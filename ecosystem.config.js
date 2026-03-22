module.exports = {
  apps: [
    {
      name: 'adventure-engine',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/adventure-engine',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '5s',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: '/var/www/adventure-engine/data/adventure.db',
      },
      out_file: '/var/log/pm2/adventure-engine-out.log',
      error_file: '/var/log/pm2/adventure-engine-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
