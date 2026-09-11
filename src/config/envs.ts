import 'dotenv/config';
import env from 'env-var';

export const envs = {
  port: env.get('PORT').default('3000').asPortNumber(),
  database: {
    host: env.get('DATABASE_HOST').default('localhost').asString(),
    port: env.get('DATABASE_PORT').default('5432').asPortNumber(),
    name: env.get('DATABASE_NAME').default('municipio_water').asString(),
    user: env.get('DATABASE_USER').default('postgres').asString(),
    password: env.get('DATABASE_PASSWORD').default('postgres').asString(),
  },
  smtp: {
    host: env.get('SMTP_HOST').default('localhost').asString(),
    port: env.get('SMTP_PORT').default('1025').asPortNumber(),
    secure: env.get('SMTP_SECURE').default('false').asBool(),
    user: env.get('SMTP_USER').default('').asString(),
    password: env.get('SMTP_PASSWORD').default('').asString(),
  },
  maintenanceEmail: env.get('MAINTENANCE_EMAIL').default('cuadrilla@example.com').asEmailString(),
};