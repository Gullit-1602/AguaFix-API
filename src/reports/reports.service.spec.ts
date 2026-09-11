import { EmailService } from '../email/email.service';
import { ReportsRepository } from './repositories/reports.repository';
import { ReportsService } from './reports.service';
import { ReportSeverity } from './entities/report.entity';

describe('ReportsService', () => {
  const reportsRepository = {
    createAndSave: jest.fn(),
    findAll: jest.fn(),
  } as unknown as ReportsRepository;
  const emailService = {
    sendEmail: jest.fn(),
  } as unknown as EmailService;
  const reportsService = new ReportsService(reportsRepository, emailService);

  beforeEach(() => jest.clearAllMocks());

  it('saves a report and sends its HTML notification', async () => {
    const reportDto = {
      address: 'Av. Central 123',
      description: 'Fuga visible en la vereda',
      severity: ReportSeverity.HIGH,
      reporterPhone: '+54 11 5555 5555',
    };
    const savedReport = { id: 1, ...reportDto, isResolved: false };
    reportsRepository.createAndSave = jest.fn().mockResolvedValue(savedReport);
    emailService.sendEmail = jest.fn().mockResolvedValue(undefined);

    const result = await reportsService.create(reportDto);

    expect(result).toEqual(savedReport);
    expect(reportsRepository.createAndSave).toHaveBeenCalledWith(reportDto);
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      'Nuevo reporte de fuga en Av. Central 123',
      expect.stringContaining('Fuga visible en la vereda'),
    );
  });
});