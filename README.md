# Municipio Water API

API NestJS para registrar fugas de agua en la via publica, almacenarlas en PostgreSQL y avisar por correo a la cuadrilla de mantenimiento.

## Puesta en marcha

Requisitos: Node.js 20+, PostgreSQL y un servidor SMTP o MailHog para desarrollo.

```bash
npm install
copy .env.example .env
npm run migration:run
npm run start:dev
```

Configura `DATABASE_*`, `SMTP_*` y `MAINTENANCE_EMAIL` en `.env`. La aplicación usa `synchronize: false`; el esquema se administra con migraciones.

## Endpoints

- `POST /auth/register`: recibe `name`, `email`, `password` e `isNotificationEnabled` opcional.
- `POST /auth/login`: recibe `email` y `password`. Credenciales inválidas responden `400 Bad Request`.
- `POST /reports`: recibe `address`, `description`, `severity` (`low`, `medium` o `high`) y `reporterPhone`; guarda el reporte y envía el correo HTML.
- `GET /reports`: lista los reportes del más reciente al más antiguo.

Las contraseñas se almacenan con `bcryptjs` y no se devuelven en las respuestas.

## Verificación

```bash
npm run build
```
