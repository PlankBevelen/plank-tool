module.exports = {
  apps: [
    {
      name: 'plank-tool',
      script: 'npm',
      args: 'run dev',
      exec_mode: 'fork',
      instances: 1,
      cwd: __dirname,
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,
      // max_memory_restart: '300M',
      autorestart: true,
      time: true
    }
  ]
};
