module.exports = {
  apps: [
    {
      name: 'pickntrust-backend',
      script: 'dist/server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'pickntrust-frontend',
<<<<<<< HEAD
      script: 'npx',
      args: 'vite --host 0.0.0.0 --port 5173',
=======
      script: 'start-frontend.js',
>>>>>>> 567c32dff71c13903bd7b6a7ba6ad0acf8691e28
      env: {
        NODE_ENV: 'development'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
