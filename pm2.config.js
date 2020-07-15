module.exports = {
  // http://pm2.keymetrics.io/docs/usage/application-declaration/
  apps: [
    {
      name: 'react-stater-kit',
      instances: 4,
      script: 'build server',
      exec_mode: 'cluster_mode',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 8808,
      },
    },
  ],
};
