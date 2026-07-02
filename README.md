# Villa Campito — Web

Sitio web de alojamiento turístico (React 19 + Vite + tRPC + Drizzle/MySQL +
Express). Este proyecto se ha preparado para funcionar de forma
**independiente de Manus** (sin OAuth de Manus, sin el runtime de Manus, sin
su proxy de almacenamiento ni su CDN).

## ⚠️ Antes de nada: migrar las fotos y vídeos (urgente)

Todas las fotos y vídeos reales de la villa estaban alojados en el CDN
privado de Manus mediante **URLs firmadas que caducan el 23/02/2027**. Ya se
han sustituido en el código por rutas locales (`/media/...`), pero los
archivos en sí **todavía no se han descargado**.

**Hazlo cuanto antes** (y siempre antes del 23/02/2027), con conexión a
internet:

```bash
node scripts/download-media.mjs
```

Esto descarga las 31 fotos + 2 vídeos a `client/public/media/` usando las
URLs originales (guardadas en `scripts/manus-media-urls.json`). No hace falta
tocar nada más: `client/src/lib/photoUrls.ts` ya apunta a esas rutas locales.

Si el script falla con error 403/expirado, las URLs ya han caducado: tendrás
que descargar las fotos/vídeos manualmente desde tu copia de seguridad o
panel de Manus y colocarlos en las rutas indicadas en
`scripts/manus-media-urls.json` (campo `localPath`).

## Requisitos

- Node.js 20+ y pnpm
- Una base de datos MySQL (local, Docker, PlanetScale, Railway, etc.)

## Configuración inicial

1. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Edita `.env` y rellena al menos `DATABASE_URL`. Cambia también
   `ADMIN_PASSWORD` antes de publicar el sitio (por defecto es
   `Villacampito2023`, la misma que ya conocía el dueño de la villa).

2. Instala dependencias (esto también actualizará `pnpm-lock.yaml`, ya que se
   han eliminado varias dependencias específicas de Manus):

   ```bash
   pnpm install
   ```

3. Crea las tablas en la base de datos:

   ```bash
   pnpm db:push
   ```

4. Descarga las fotos/vídeos (ver sección anterior):

   ```bash
   node scripts/download-media.mjs
   ```

## Desarrollo

```bash
pnpm dev
```

Arranca el servidor Express + Vite en modo desarrollo (puerto 3000 por
defecto, o el siguiente libre).

## Producción

```bash
pnpm build   # compila el cliente (Vite) y el servidor (esbuild) a dist/
pnpm start   # arranca dist/index.js con NODE_ENV=production
```

Despliega esto en cualquier host Node (VPS con PM2/systemd, Docker, Railway,
Render, etc.). Necesitas que las variables de `.env` estén disponibles en
ese entorno.

### Despliegue con Docker en un VPS (Hetzner) — multidominio

Si vas a alojar este sitio (y posiblemente otros proyectos) en tu propio
VPS, usa el `Dockerfile` + `docker-compose.yml` incluidos, junto con el
proxy compartido en `deploy/infra-caddy/` (Caddy: HTTPS automático para
varios dominios/proyectos en el mismo servidor).

Guía completa paso a paso: **[DEPLOY.md](./DEPLOY.md)**.

Para actualizaciones posteriores, `./deploy.sh` hace `git pull` + rebuild +
migraciones en un solo paso.

## Panel de administración (`/admin`)

Acceso mediante la contraseña definida en `ADMIN_PASSWORD`. Permite:

- Gestionar el calendario de días ocupados.
- Crear/editar/activar ofertas y promociones (con imagen).

## Imágenes subidas desde el panel de ofertas

Por defecto se guardan en disco local, en la carpeta `uploads/` (configurable
con `UPLOADS_DIR`) y se sirven en `/uploads/<archivo>`. Funciona en cualquier
servidor con disco persistente, sin configuración adicional.

Si despliegas en una plataforma sin disco persistente, configura S3 con las
variables `S3_BUCKET`, `AWS_REGION` (y credenciales AWS estándar) — ver
`.env.example` para más detalle. `@aws-sdk/client-s3` ya está incluido como
dependencia.

## Analíticas (Umami)

`client/index.html` incluye un script de Umami Analytics que usa las
variables `VITE_ANALYTICS_ENDPOINT` y `VITE_ANALYTICS_WEBSITE_ID` (se
sustituyen al compilar). Si tienes tu propia instancia de Umami, defínelas en
`.env`. Si no usas analíticas, puedes borrar ese `<script>` de
`client/index.html`.

## Qué se ha quitado / cambiado respecto a la versión de Manus

- Eliminado el runtime/plugins de desarrollo de Manus (`vite-plugin-manus-runtime`,
  recolector de logs de depuración, parche de `wouter`).
- Eliminado el login OAuth de Manus y el chat con IA (`/api/chat`), que no se
  usaban en el sitio público (el panel `/admin` siempre usó su propia
  contraseña, no OAuth).
- Eliminados componentes/páginas de demostración no usados (`AIChatBox`,
  `ManusDialog`, `ComponentShowcase`, `DashboardLayout`, etc.).
- Sustituido el proxy de almacenamiento de Manus por almacenamiento local en
  disco (con opción de S3).
- La contraseña del panel de admin ahora se lee de la variable de entorno
  `ADMIN_PASSWORD` (antes estaba escrita directamente en el código).
- La nota de "Estadísticas de la web" en `/admin` ya no menciona el panel de
  Manus; ahora describe el acceso a Umami.
- El badge "Made with Manus" no formaba parte del código del sitio (lo añadía
  la propia plataforma de Manus al servir el sitio), así que no requiere
  ningún cambio: desaparecerá automáticamente al alojar el sitio fuera de
  Manus.
