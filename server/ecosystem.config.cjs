module.exports = {
  apps: [
    {
      name: 'plank-tool',
      script: 'src/server.js',
      exec_mode: 'cluster',
      instances: 'max',
      cwd: __dirname,
      // watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UPLOADS_CLEANUP_ENABLED: 'true',
        UPLOADS_TTL_MS: 3600000,
        UPLOADS_CLEAN_INTERVAL_MS: 900000
      },
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,
      // max_memory_restart: '300M',
      autorestart: true,
      time: true
    }
  ]
};
