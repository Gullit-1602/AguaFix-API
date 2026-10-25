# Agua Fix II

API NestJS para registrar fugas, almacenar sus fotos en S3 y notificar por correo a la cuadrilla. PostgreSQL conserva los reportes y los usuarios. Las contraseñas de usuarios se almacenan con bcrypt y no se devuelven en las respuestas.

## Desarrollo con Node y PostgreSQL

Docker no es necesario para ejecutar las pruebas locales. La imagen utiliza Node 22; para reproducir ese entorno se recomienda la misma versión en desarrollo.

Desde PowerShell, en la carpeta del proyecto:

```powershell
Set-Location P:\
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Completar `.env` sin mostrarlo en capturas. No reemplazar un archivo existente. La configuración local usa PostgreSQL en `127.0.0.1:55432`, base `aguafix_ii`, usuario `aguafix_ii_app` y API en `127.0.0.1:3001`. La contraseña debe corresponder al usuario creado en PostgreSQL; no hay una contraseña predeterminada en `.env.example`.

```powershell
npm.cmd run migration:run
npm.cmd test -- --runInBand
npm.cmd run build
npm.cmd start
```

Resultados esperados: migraciones aplicadas o ninguna pendiente, pruebas correctas, `dist/main.js` creado y API disponible en `http://localhost:3001`. Si el puerto está ocupado por otra instancia de esta API, usar esa instancia o detenerla antes de arrancar otra.

```powershell
Invoke-RestMethod http://localhost:3001/reports
```

`HOST=127.0.0.1` limita el acceso local. Dentro de la imagen, `HOST=0.0.0.0` permite que Docker enrute el puerto; Compose lo publica únicamente en la interfaz de loopback del host.

## Configuración

| Variables | Uso |
|---|---|
| `HOST`, `PORT` | Dirección de escucha de NestJS |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` | Conexión PostgreSQL |
| `DATABASE_SSL`, `DATABASE_SSL_CA_FILE` | TLS y archivo CA del proveedor, si corresponde |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS` | Transporte SMTP |
| `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `MAINTENANCE_EMAIL` | Autenticación, remitente y destinatario |
| `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Almacenamiento S3 |
| `AWS_SESSION_TOKEN` | Solo para credenciales temporales |
| `DOCKER_USER`, `DOCKER_IMAGE` | Imagen que utilizará Compose |

En PostgreSQL local se utiliza `DATABASE_SSL=false`. Para un proveedor alojado, seguir sus instrucciones de certificados, activar `DATABASE_SSL=true` y proporcionar su CA si hace falta. La validación del certificado permanece activada.

### Gmail

1. En Edge, abrir la cuenta que se utilizará en esta actividad.
2. Activar la verificación en dos pasos si aún no está habilitada.
3. Crear una contraseña de aplicación y guardarla directamente en `.env`, como `SMTP_PASSWORD`. Una contraseña expuesta debe revocarse y reemplazarse.
4. Configurar `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false` y `SMTP_REQUIRE_TLS=true`.
5. Poner la dirección Gmail en `SMTP_USER` y `SMTP_FROM`. Para la demostración, `MAINTENANCE_EMAIL` puede ser esa misma cuenta.
6. Reiniciar la API después de guardar los cambios.

Algunas cuentas no permiten contraseñas de aplicación. En ese caso, Brevo SMTP puede utilizarse conservando el servicio de correo: configurar el host, usuario y clave SMTP indicados por Brevo y un `SMTP_FROM` verificado. No utilizar una clave de API HTTP como contraseña SMTP.

Fuente: [contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833?hl=es).

### S3

Usar un bucket de este proyecto, con nombre DNS sin puntos, y su región real. Revisar los costos y condiciones de la cuenta antes de crear recursos. No utilizar credenciales de la cuenta raíz.

El usuario IAM de la API necesita esta política, sustituyendo `NOMBRE_BUCKET` por el bucket real:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::NOMBRE_BUCKET/reports/*"
  }]
}
```

Para que las fotos puedan verse sin autenticación, la política del bucket puede permitir lectura exclusivamente del prefijo:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "ReadReportPhotos",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::NOMBRE_BUCKET/reports/*"
  }]
}
```

Mantener Object Ownership en Bucket owner enforced, sin ACL. Las opciones BlockPublicPolicy y RestrictPublicBuckets deben permitir esta política; BlockPublicAcls e IgnorePublicAcls pueden permanecer activadas. Las restricciones de cuenta u organización también se aplican. Revisarlas antes de cambiar una protección de alcance mayor. No conceder lectura a `bucket/*` ni escritura pública. Usar fotos sin información personal.

La aplicación no modifica permisos ni ACL. Una URL construida no demuestra acceso público: después del POST, abrir `photoUrl` en una ventana InPrivate sin sesión AWS y comprobar la foto dentro del correo recibido. Para esta configuración básica se recomienda el cifrado SSE-S3; SSE-KMS requiere permisos adicionales y no debe suponerse compatible con lectura anónima.

Fuentes: [acceso por prefijo](https://repost.aws/knowledge-center/read-access-objects-s3-bucket), [bloqueo de acceso público](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html).

## Endpoints y Postman

`POST http://localhost:3001/reports`: seleccionar **Body → form-data**. No establecer manualmente el encabezado Content-Type; Postman debe incluir el boundary.

| Clave | Tipo | Ejemplo / restricción |
|---|---|---|
| `address` | Text | Calle Central 10; obligatorio, hasta 255 caracteres |
| `description` | Text | Fuga en la banqueta; obligatorio, hasta 2000 caracteres |
| `severity` | Text | `low`, `medium` o `high` |
| `reporterPhone` | Text | `5550000000`; obligatorio, hasta 50 caracteres |
| `photo` | File | Foto JPEG, PNG o WebP, máximo 5 MiB |

Estos son todos los campos del DTO. El teléfono sigue siendo texto para conservar ceros iniciales y prefijos; no existen campos numéricos en este formulario. No enviar `photoUrl`, `repairPhotoUrl`, `id` ni `isResolved` en el POST.

El contenido del archivo determina su tipo; cambiar la extensión o declarar un MIME de imagen no hace válida una carga de texto. Cada foto recibe un nombre único en `reports/`. El POST exitoso responde **201**, con `photoUrl` real y `repairPhotoUrl: null`, después del guardado y envío SMTP.

`GET /reports` devuelve los campos originales y las dos URLs. Los reportes anteriores tienen URLs nulas. `repairPhotoUrl` queda reservado sin inventar un flujo de reparación.

| Comprobación | Resultado esperado |
|---|---|
| POST válido | 201; reporte persistido, objeto en S3 y correo recibido con foto |
| Abrir `photoUrl` sin sesión | Foto visible; no 403 |
| GET después del POST | Mismo ID y `photoUrl`; `repairPhotoUrl` null |
| Quitar `photo` | 400, sin reporte nuevo |
| Archivo vacío, texto o SVG | 400, sin reporte nuevo |
| Archivo mayor de 5 MiB | 413, sin reporte nuevo |
| Severidad `urgent` o campo obligatorio ausente | 400, sin reporte nuevo |
| Fallo de S3 | 503, sin reporte guardado |
| Fallo de guardado | 503; se intenta eliminar la foto subida |
| Fallo SMTP después del guardado | 502 con `reportId`; reporte y foto conservados |

Ante un 502 SMTP no repetir automáticamente el POST: consultar el ID devuelto y corregir SMTP. No existe reintento automático de notificación. Si también falla la limpieza tras un error de base, el log avisa que hay que revisar objetos huérfanos.

Para verificar las funciones previas, `POST /auth/register` recibe JSON con `name`, `email`, `password` (mínimo 8 caracteres) e `isNotificationEnabled` booleano opcional. `POST /auth/login` recibe `email` y `password`. Registro y login válidos responden 201 sin contraseña; credenciales incorrectas responden 400. Usar una cuenta de prueba neutral controlada.

## Migraciones

`synchronize` permanece en false. La migración original no cambia. `AddReportPhotos1792800000000` añade dos columnas nullable; de ese modo conserva reportes anteriores sin inventar URLs. El endpoint exige foto para nuevos reportes.

```powershell
npm.cmd run migration:run
```

Para revertir solo la última migración, comprobar primero que sea `AddReportPhotos1792800000000`. La reversión elimina las columnas y sus valores, pero conserva la tabla y los reportes; no elimina objetos S3. Hacer respaldo antes de usarla sobre datos reales.

```powershell
npx.cmd typeorm-ts-node-commonjs -d src/database/data-source.ts migration:show
npm.cmd run migration:revert
```

No repetir `migration:revert`: la migración original anterior elimina las tablas. La prueba de reversibilidad debe hacerse dentro de una transacción revertida o en una base de pruebas.

## Docker y publicación remota

El Dockerfile usa `node:22-alpine`, ejecuta pruebas y compilación y crea una etapa final con dependencias de producción. Arranca con `node dist/main`. Incluye migraciones compiladas y la CLI de TypeORM. Los COPY enumeran solo archivos necesarios; `.env`, sus variantes, Compose y credenciales quedan fuera de todas las etapas.

El workflow se ejecuta tras un push a `main`, en `ubuntu-latest`. Usa exclusivamente `secrets.DOCKER_USER` y `secrets.DOCKER_PASSWORD` para autenticarse y publica `latest`.

Preparación en Edge:

1. En Docker Hub, entrar como `gullit1602` y crear el repositorio `aguafix-api`.
2. Crear un token de Docker Hub con permiso de lectura y escritura para publicar.
3. En GitHub, **Settings → Secrets and variables → Actions → Secrets**, crear `DOCKER_USER` con el usuario indicado y `DOCKER_PASSWORD` con el token. No mostrarlo.
4. En la pestaña **Variables**, crear `DOCKER_IMAGE` con `aguafix-api`.

No añadir credenciales AWS, SMTP ni PostgreSQL al workflow ni a argumentos de construcción. El repositorio remoto tiene `master`; la rama local `main` parte del mismo historial. Después de las pruebas y de autorizar el push, publicar `main` y revisar si debe establecerse como rama predeterminada. No borrar `master` ni reescribir historia.

Fuentes: [acciones oficiales Docker](https://docs.docker.com/build/ci/github-actions/), [build-push-action](https://github.com/docker/build-push-action), [checkout](https://github.com/actions/checkout).

### Ejecutar la imagen publicada en un host remoto

Estos comandos son exclusivamente para un host remoto con Docker, después de publicar y autorizar el entorno. No ejecutarlos en la computadora de desarrollo. `compose.yaml` utiliza la imagen de Docker Hub, PostgreSQL con volumen persistente y una comprobación de disponibilidad.

Preparar `.env` en ese host con valores reales. Compose utiliza internamente `postgres:5432`, independientemente de la conexión local de desarrollo.

```powershell
docker compose pull
docker compose up -d postgres
docker compose run --rm api npm run migration:run:prod
# Continuar solo si la migracion termina con codigo 0.
docker compose up -d api
docker compose ps
```

Las dependencias esperarán el healthcheck de PostgreSQL. Las migraciones son un paso explícito previo al arranque de la API. No ejecutar `docker compose down -v`: retiraría el volumen de datos.

Mantener la API privada y utilizar un túnel autenticado para Postman. La URL y el túnel dependen del host que se autorice. Repetir POST, GET, S3 y correo usando la imagen descargada. Compilar con Actions no demuestra que la imagen publicada se haya ejecutado.

## Rutas, autenticación y grabación

Restablecer la ruta alternativa después de reiniciar, comprobando que P: esté libre:

```powershell
if (-not (Test-Path P:\)) {
  $projectPath = Join-Path $env:USERPROFILE 'Documents\AguaAPi'
  subst P: $projectPath
}
Set-Location P:\
code P:\
```

Si P: corresponde a otra ubicación, no reemplazarla. Usar otra letra libre. La ubicación física y el historial del repositorio se conservan.

La sesión GitHub y la identidad del autor de commits son distintas. Para autenticar Git Credential Manager sin depender del navegador predeterminado, ejecutar en una terminal privada y seguir el flujo de dispositivo en Edge con la cuenta `Gullit-1602`:

```powershell
git credential-manager github login --username Gullit-1602 --device
```

No grabar el código temporal ni los permisos de autenticación. Configurar el autor futuro con un nombre propio elegido y el correo verificado o noreply real de esa cuenta, sin falsificar autores ni reescribir commits anteriores.

Antes del video, revisar perfil del editor, terminal, autor de commits, perfil y URL de GitHub, usuario Docker Hub, remitente/destinatario del correo, nombres AWS y contenido de ejemplos. Cerrar la bienvenida y listas de proyectos recientes, que pueden mostrar rutas personales. P: no oculta cuentas ni datos existentes. Si una herramienta muestra rutas físicas, considerar una ubicación neutral como `C:\Proyectos\AguaApi` solo después de acordar el traslado.

Las pruebas funcionales deben estar completas antes de grabar el commit. Orden del video:

1. Mostrar un cambio real del código, el commit autorizado y el push a main.
2. Mostrar GitHub Actions ejecutándose y finalizando en verde.
3. Mostrar Docker Hub, el tag latest y la fecha de publicación.
4. Mostrar POST con foto en Postman, el objeto S3 y el correo recibido con foto visible.

No hacer commits vacíos ni presentar pruebas con Node como ejecución de la imagen Docker.

Repositorio: https://github.com/Gullit-1602/AguaFix-API

Destino de la imagen, pendiente de crear/verificar y publicar: https://hub.docker.com/r/gullit1602/aguafix-api
