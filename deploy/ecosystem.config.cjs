/** PM2 process file — run from /var/www/uniqueskyway: pm2 start deploy/ecosystem.config.cjs */
const path = require("path");

const deployRoot = __dirname;
const appRoot = process.env.APP_ROOT || path.join(deployRoot, "..", "current");
const sharedRoot = process.env.SHARED_ROOT || path.join(deployRoot, "..", "shared");

module.exports = {
  apps: [
    {
      name: "uniqueskyway",
      cwd: appRoot,
      script: path.join(deployRoot, "start.sh"),
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "800M",
      error_file: path.join(sharedRoot, "logs/pm2-error.log"),
      out_file: path.join(sharedRoot, "logs/pm2-out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
