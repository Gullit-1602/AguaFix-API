import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config/envs';
import { databaseSsl } from './config/database-ssl';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { Report } from './reports/entities/report.entity';
import { ReportsModule } from './reports/reports.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.database.host,
      port: envs.database.port,
      username: envs.database.user,
      password: envs.database.password,
      database: envs.database.name,
      ssl: databaseSsl,
      entities: [Report, User],
      synchronize: false,
    }),
    EmailModule,
    AuthModule,
    ReportsModule,
  ],
})
export class AppModule {}
