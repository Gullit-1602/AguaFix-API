import { readFileSync } from 'node:fs';
import { envs } from './envs';

export const databaseSsl = envs.database.ssl
  ? {
      rejectUnauthorized: true,
      ...(envs.database.sslCaFile ? { ca: readFileSync(envs.database.sslCaFile, 'utf8') } : {}),
    }
  : false;
