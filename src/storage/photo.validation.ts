import { BadRequestException, FileTypeValidator, PayloadTooLargeException } from '@nestjs/common';

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export async function validatePhoto(file?: Express.Multer.File): Promise<void> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('El archivo photo es obligatorio y no puede estar vacio');
  }
  if (file.buffer.length > MAX_PHOTO_SIZE) {
    throw new PayloadTooLargeException('La foto no puede superar 5 MiB');
  }
  const validator = new FileTypeValidator({
    fileType: /^image\/(jpeg|png|webp)$/,
    overrideMimeType: true,
  });
  if (!(await validator.isValid(file))) {
    throw new BadRequestException('La foto debe ser una imagen JPEG, PNG o WebP');
  }
}
