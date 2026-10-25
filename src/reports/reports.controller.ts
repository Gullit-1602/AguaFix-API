import { Body, Controller, Get, Post, UploadedFile, UseInterceptors, ParseFilePipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_PHOTO_SIZE } from '../storage/photo.validation';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo', {
    limits: { fileSize: MAX_PHOTO_SIZE, files: 1, fields: 4, fieldSize: 8192, parts: 6 },
  }))
  create(
    @Body() dto: CreateReportDto,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) photo: Express.Multer.File,
  ) {
    return this.reportsService.create(dto, photo);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }
}
