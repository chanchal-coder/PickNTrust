module.exports = {
  apps: [
    {
      name: 'pickntrust-backend',
      cwd: '/home/ec2-user/pickntrust',
      script: 'dist/server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'file:./database.sqlite',
        FRONTEND_STATIC_DIR: '/home/ec2-user/pickntrust/dist/public'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
