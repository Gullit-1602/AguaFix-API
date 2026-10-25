import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from '../config/envs';

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: envs.smtp.host,
    port: envs.smtp.port,
    secure: envs.smtp.secure,
    requireTLS: envs.smtp.requireTLS,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: envs.smtp.user ? { user: envs.smtp.user, pass: envs.smtp.password } : undefined,
  });

  sendEmail(to: string, subject: string, template: string): Promise<nodemailer.SentMessageInfo> {
    return this.transporter.sendMail({
      from: envs.smtp.from || envs.smtp.user || 'no-reply@municipio.local',
      to,
      subject,
      html: template,
    });
  }
}
