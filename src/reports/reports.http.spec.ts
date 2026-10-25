import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repositories/reports.repository';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
import { MAX_PHOTO_SIZE } from '../storage/photo.validation';
import { envs } from '../config/envs';

jest.mock('../config/envs', () => ({ envs: {
  maintenanceEmail: 'cuadrilla@example.com',
  storage: { region: 'us-east-1', bucket: 'example-test-bucket', accessKeyId: 'test', secretAccessKey: 'test' },
} }));

describe('Reports HTTP con servicios externos sustituidos', () => {
  let app: INestApplication;
  let baseUrl: string;
  const repository = { createAndSave: jest.fn(), findAll: jest.fn() };
  const email = { sendEmail: jest.fn() };
  const s3 = jest.spyOn(S3Client.prototype, 'send');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5YQAAAAASUVORK5CYII=', 'base64');

  function form(bytes: Buffer | null = png, severity = 'high'): FormData {
    const body = new FormData();
    body.set('address', 'Calle Central 10');
    body.set('description', '<script>alert("x")</script>');
    body.set('severity', severity);
    body.set('reporterPhone', '005550000000');
    if (bytes) body.set('photo', new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), 'foto.jpg');
    return body;
  }

  async function post(body = form()) {
    const response = await fetch(`${baseUrl}/reports`, { method: 'POST', body });
    return { status: response.status, data: await response.json() };
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [ReportsService, StorageService,
        { provide: ReportsRepository, useValue: repository },
        { provide: EmailService, useValue: email }],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => { await app.close(); s3.mockRestore(); });
  beforeEach(() => {
    jest.resetAllMocks();
    s3.mockImplementation((async () => ({})) as never);
    repository.createAndSave.mockImplementation(async data => ({ id: 1, ...data, repairPhotoUrl: null, isResolved: false }));
    email.sendEmail.mockResolvedValue(undefined);
  });

  it('responde 201, detecta PNG por contenido y escapa el HTML', async () => {
    const { status, data } = await post();
    expect(status).toBe(201);
    expect(data).toMatchObject({ reporterPhone: '005550000000', severity: 'high', repairPhotoUrl: null });
    expect(data.photoUrl).toMatch(/^https:\/\/example-test-bucket\.s3\.us-east-1\.amazonaws\.com\/reports\/[0-9a-f-]+\.png$/);
    const command = s3.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({ ContentType: 'image/png', Body: png });
    expect(command.input).not.toHaveProperty('ACL');
    const html = email.sendEmail.mock.calls[0][2];
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain(`<img src="${data.photoUrl}"`);
  });

  it.each([
    ['sin foto', null, 'high', 400],
    ['MIME falsificado', Buffer.from('esto no es una foto'), 'high', 400],
    ['archivo vacio', Buffer.alloc(0), 'high', 400],
    ['severidad invalida', png, 'urgent', 400],
    ['archivo excesivo', Buffer.alloc(MAX_PHOTO_SIZE + 1), 'high', 413],
  ])('rechaza %s antes de S3 o persistencia', async (_label, bytes, severity, status) => {
    expect((await post(form(bytes, severity))).status).toBe(status);
    expect(s3).not.toHaveBeenCalled();
    expect(repository.createAndSave).not.toHaveBeenCalled();
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it('rechaza un archivo con nombre de campo incorrecto', async () => {
    const body = form(null);
    body.set('file', new Blob([new Uint8Array(png)]), 'foto.png');
    expect((await post(body)).status).toBe(400);
    expect(s3).not.toHaveBeenCalled();
  });

  it('rechaza campos obligatorios ausentes y campos adicionales', async () => {
    for (const field of ['address', 'description', 'severity', 'reporterPhone']) {
      const body = form();
      body.delete(field);
      expect((await post(body)).status).toBe(400);
    }
    const body = form();
    body.set('photoUrl', 'https://example.com/injected.png');
    expect((await post(body)).status).toBe(400);
    expect(s3).not.toHaveBeenCalled();
  });

  it('no usa credenciales de otras cuentas si falta configuracion de S3', async () => {
    const accessKey = envs.storage.accessKeyId;
    envs.storage.accessKeyId = '';
    try {
      expect((await post()).status).toBe(503);
      expect(s3).not.toHaveBeenCalled();
    } finally { envs.storage.accessKeyId = accessKey; }
  });

  it('no guarda ni envia correo si S3 falla', async () => {
    s3.mockRejectedValueOnce(new Error('S3 unavailable') as never);
    expect((await post()).status).toBe(503);
    expect(repository.createAndSave).not.toHaveBeenCalled();
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it('retira de S3 el mismo objeto cuando falla la base', async () => {
    repository.createAndSave.mockRejectedValueOnce(new Error('database unavailable'));
    expect((await post()).status).toBe(503);
    const put = s3.mock.calls[0][0] as PutObjectCommand;
    const deletion = s3.mock.calls[1][0] as DeleteObjectCommand;
    expect(deletion).toBeInstanceOf(DeleteObjectCommand);
    expect(deletion.input.Key).toBe(put.input.Key);
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it('informa el fallo de limpieza sin ocultar el fallo de guardado', async () => {
    repository.createAndSave.mockRejectedValueOnce(new Error('database unavailable'));
    s3.mockResolvedValueOnce({} as never).mockRejectedValueOnce(new Error('S3 unavailable') as never);
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      expect((await post()).status).toBe(503);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('objetos huerfanos'));
    } finally { log.mockRestore(); }
  });

  it('conserva reporte y foto e informa el ID cuando falla SMTP', async () => {
    email.sendEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));
    const response = await post();
    expect(response).toMatchObject({ status: 502, data: { reportId: 1 } });
    expect(s3).toHaveBeenCalledTimes(1);
    expect(repository.createAndSave).toHaveBeenCalledTimes(1);
  });

  it('genera nombres distintos para fotos repetidas', async () => {
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(201);
    expect((s3.mock.calls[0][0] as PutObjectCommand).input.Key)
      .not.toBe((s3.mock.calls[1][0] as PutObjectCommand).input.Key);
  });

  it('GET conserva los datos e incluye las dos URLs nullable', async () => {
    const report = { id: 1, address: 'Calle Central 10', photoUrl: null, repairPhotoUrl: null };
    repository.findAll.mockResolvedValueOnce([report]);
    const response = await fetch(`${baseUrl}/reports`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([report]);
  });
});
