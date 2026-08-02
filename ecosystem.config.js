/**
 * PM2 config — run exactly ONE production instance.
 *
 * Usage on server:
 *   pm2 delete all          # remove duplicate/orphan processes first
 *   pm2 start ecosystem.config.js
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "garg",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 4444,
        DB_CONNECTION_LIMIT: "20",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
