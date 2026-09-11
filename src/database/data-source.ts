import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { envs } from '../config/envs';
import { Report } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envs.database.host,
  port: envs.database.port,
  username: envs.database.user,
  password: envs.database.password,
  database: envs.database.name,
  entities: [Report, User],
  migrations: [__dirname + '/migrations/*{.js,.ts}'],
  synchronize: false,
});