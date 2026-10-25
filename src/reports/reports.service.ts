import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { CreateReportDto } from './dto/create-report.dto';
import { generateReportTemplate } from './templates/report.template';
import { ReportsRepository } from './repositories/reports.repository';
import { Report } from './entities/report.entity';
import { envs } from '../config/envs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateReportDto, photo: Express.Multer.File): Promise<Report> {
    const photoUrl = await this.storageService.uploadFile(photo, 'reports');
    let report: Report;
    try {
      report = await this.reportsRepository.createAndSave({ ...dto, photoUrl });
    } catch {
      try {
        await this.storageService.deleteFile(photoUrl);
      } catch {
        this.logger.error('No se pudo retirar de S3 la foto del reporte fallido; revisar objetos huerfanos en reports/');
      }
      throw new ServiceUnavailableException('No se pudo guardar el reporte, intente luego.');
    }
    try {
      await this.emailService.sendEmail(
        envs.maintenanceEmail,
        `Nuevo reporte de fuga en ${dto.address}`,
        generateReportTemplate(dto, photoUrl),
      );
    } catch {
      throw new BadGatewayException({
        statusCode: 502,
        message: 'El reporte y su foto quedaron guardados, pero fallo el correo. No repitas el POST; revisa SMTP y el reporte indicado.',
        reportId: report.id,
      });
    }
    return report;
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.findAll();
  }
}
