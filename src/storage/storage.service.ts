import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { envs } from '../config/envs';
import { validatePhoto } from './photo.validation';

@Injectable()
export class StorageService {
  private client?: S3Client;

  private getClient(): S3Client {
    const { region, bucket, accessKeyId, secretAccessKey, sessionToken } = envs.storage;
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException('Falta configurar el almacenamiento S3');
    }
    if (!/^[a-z0-9-]+$/.test(region) || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
      throw new ServiceUnavailableException('Revisa la region y el bucket S3; usa un bucket sin puntos');
    }
    this.client ??= new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey, sessionToken: sessionToken || undefined },
    });
    return this.client;
  }

  private get publicBaseUrl(): string {
    const suffix = envs.storage.region.startsWith('cn-') ? 'amazonaws.com.cn' : 'amazonaws.com';
    return `https://${envs.storage.bucket}.s3.${envs.storage.region}.${suffix}/`;
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    await validatePhoto(file);
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(folder)) {
      throw new Error('Prefijo de almacenamiento invalido');
    }
    const client = this.getClient();
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.mimetype];
    const key = `${folder}/${randomUUID()}.${extension}`;
    try {
      await client.send(new PutObjectCommand({
        Bucket: envs.storage.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
    } catch {
      throw new ServiceUnavailableException('No se pudo subir la foto a S3; el reporte no fue guardado');
    }
    return `${this.publicBaseUrl}${key}`;
  }

  async deleteFile(photoUrl: string): Promise<void> {
    const client = this.getClient();
    if (!photoUrl.startsWith(`${this.publicBaseUrl}reports/`)) {
      throw new Error('La foto no pertenece al prefijo reports del bucket configurado');
    }
    await client.send(new DeleteObjectCommand({
      Bucket: envs.storage.bucket,
      Key: photoUrl.slice(this.publicBaseUrl.length),
    }));
  }
}
