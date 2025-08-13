module.exports = {
  apps: [{
    name: 'pickntrust',
    script: 'dist/server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'file:./sqlite.db',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_ANON_KEY: 'dummy_key_for_local_sqlite',
      SUPABASE_SERVICE_ROLE_KEY: 'dummy_service_key_for_local_sqlite',
      VITE_API_URL: 'http://localhost:5000/api'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
