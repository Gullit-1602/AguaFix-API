import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ReportSeverity } from '../entities/report.entity';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsEnum(ReportSeverity)
  severity: ReportSeverity;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  reporterPhone: string;
}