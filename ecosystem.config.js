module.exports = {
  apps: [
    {
      name: 'back-asignaciones',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '-r dotenv/config',
      env: {
        NODE_ENV: 'dev',
        PORT: 4041,           // HTTP en puerto 4041
        PORT_HTTPS: 11443,    // HTTPS en puerto 11443
        DOTENV_CONFIG_PATH: '.env.dev'
      },
      env_development: {
        NODE_ENV: 'dev',
        PORT: 4041,
        PORT_HTTPS: 11443,
        DOTENV_CONFIG_PATH: '.env.dev'
      },
       env_preproduction: {
        NODE_ENV: 'preproduction',
        PORT: 4042,
        PORT_HTTPS: 12444,
        DOTENV_CONFIG_PATH: '.env.pre'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 11443,
        DOTENV_CONFIG_PATH: '.env.pro'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000
      },
      // Configuraciones adicionales
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Configuraciones de restart
      watch: false, // Cambiar a true si quieres auto-restart en cambios
      ignore_watch: [
        'node_modules',
        'logs',
        '.git'
      ],
      // Configuraciones de escalabilidad
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      // Variables de entorno adicionales
      env_vars: {
        'COMMON_VARIABLE': 'true'
      }
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/back-asignaciones.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};