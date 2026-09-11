import { CreateReportDto } from '../dto/create-report.dto';

const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] as string);

export const generateReportTemplate = (dto: CreateReportDto): string => `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"><title>Nuevo reporte de fuga</title></head>
  <body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5">
    <h1 style="color:#0f766e">Nuevo reporte de fuga de agua</h1>
    <table style="border-collapse:collapse;max-width:640px;width:100%">
      <tr><th style="text-align:left;background:#e6fffb;padding:10px;border:1px solid #cbd5e1">Direccion</th><td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(dto.address)}</td></tr>
      <tr><th style="text-align:left;background:#e6fffb;padding:10px;border:1px solid #cbd5e1">Descripcion</th><td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(dto.description)}</td></tr>
      <tr><th style="text-align:left;background:#e6fffb;padding:10px;border:1px solid #cbd5e1">Severidad</th><td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(dto.severity)}</td></tr>
      <tr><th style="text-align:left;background:#e6fffb;padding:10px;border:1px solid #cbd5e1">Telefono de contacto</th><td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(dto.reporterPhone)}</td></tr>
    </table>
  </body>
</html>`;