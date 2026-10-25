import 'dotenv/config';
import env from 'env-var';

export const envs = {
  host: env.get('HOST').default('127.0.0.1').asString(),
  port: env.get('PORT').default('3000').asPortNumber(),
  database: {
    host: env.get('DATABASE_HOST').default('localhost').asString(),
    port: env.get('DATABASE_PORT').default('5432').asPortNumber(),
    name: env.get('DATABASE_NAME').default('municipio_water').asString(),
    user: env.get('DATABASE_USER').default('postgres').asString(),
    password: env.get('DATABASE_PASSWORD').default('').asString(),
    ssl: env.get('DATABASE_SSL').default('false').asBool(),
    sslCaFile: env.get('DATABASE_SSL_CA_FILE').default('').asString(),
  },
  smtp: {
    host: env.get('SMTP_HOST').default('localhost').asString(),
    port: env.get('SMTP_PORT').default('1025').asPortNumber(),
    secure: env.get('SMTP_SECURE').default('false').asBool(),
    user: env.get('SMTP_USER').default('').asString(),
    password: env.get('SMTP_PASSWORD').default('').asString(),
    from: env.get('SMTP_FROM').default('').asString(),
    requireTLS: env.get('SMTP_REQUIRE_TLS').default('true').asBool(),
  },
  storage: {
    region: env.get('AWS_REGION').default('').asString(),
    bucket: env.get('AWS_S3_BUCKET').default('').asString(),
    accessKeyId: env.get('AWS_ACCESS_KEY_ID').default('').asString(),
    secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY').default('').asString(),
    sessionToken: env.get('AWS_SESSION_TOKEN').default('').asString(),
  },
  maintenanceEmail: env.get('MAINTENANCE_EMAIL').default('cuadrilla@example.com').asEmailString(),
};
