module.exports = {
  apps: [
    {
      name: 'meta',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
