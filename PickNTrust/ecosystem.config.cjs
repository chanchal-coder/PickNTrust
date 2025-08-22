module.exports = {
  apps: [
    {
      name: 'pickntrust-backend',
      script: 'dist/server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'file:./sqlite.db'
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
    },
    {
      name: 'pickntrust-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './client',
      env: {
        NODE_ENV: 'development',
        PORT: 5173,
        VITE_API_URL: 'http://localhost:5000'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
