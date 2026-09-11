import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { CreateReportDto } from './dto/create-report.dto';
import { generateReportTemplate } from './templates/report.template';
import { ReportsRepository } from './repositories/reports.repository';
import { Report } from './entities/report.entity';
import { envs } from '../config/envs';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateReportDto): Promise<Report> {
    const report = await this.reportsRepository.createAndSave(dto);
    await this.emailService.sendEmail(
      envs.maintenanceEmail,
      `Nuevo reporte de fuga en ${dto.address}`,
      generateReportTemplate(dto),
    );
    return report;
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.findAll();
  }
}