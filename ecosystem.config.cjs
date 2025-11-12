module.exports = {
  apps: [
    {
      name: 'pickntrust-backend',
      cwd: '/home/ec2-user/pickntrust',
      script: 'dist/server/server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'file:./database.sqlite',
        FRONTEND_STATIC_DIR: '/home/ec2-user/pickntrust/dist/public',
        // Ensure uploads land under the static dir Nginx serves
        UPLOAD_DIR: '/home/ec2-user/pickntrust/dist/public/uploads',
        // Allow larger device video uploads (in MB)
        FILE_UPLOAD_MAX_MB: '100',
        STATIC_BANNERS_PATH: '/home/ec2-user/pickntrust/dist/public/config/banners.json',
        DEBUG_BANNERS: '1'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: ['--max-old-space-size=512', '--experimental-specifier-resolution=node'],
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'pickntrust-bot',
      cwd: '/home/ec2-user/pickntrust',
      script: 'dist/server/server/telegram-bot.js',
      env: {
        NODE_ENV: 'production',
        ENABLE_TELEGRAM_BOT: 'true',
        PUBLIC_BASE_URL: 'https://pickntrust.com',
        MASTER_BOT_TOKEN: '8433200963:AAFE8umMtF23xgE7pBZA6wjIVg-o-2GeEvE'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      node_args: ['--experimental-specifier-resolution=node'],
      error_file: './logs/bot-err.log',
      out_file: './logs/bot-out.log',
      log_file: './logs/bot-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
