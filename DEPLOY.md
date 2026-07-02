# DEPLOY.md — Villa Campito en Hetzner (Docker + Caddy multidominio)

Esta guía monta el sitio en un VPS de Hetzner, con HTTPS automático y
preparado para alojar más proyectos/dominios en el futuro en el mismo
servidor. Pensada para que Claude Code la siga paso a paso.

Resumen de la arquitectura:

- **Caddy compartido** (`deploy/infra-caddy/`): un único proxy inverso para
  todo el VPS. Gestiona HTTPS (Let's Encrypt) para todos los dominios. Se
  instala UNA VEZ, fuera de este repo.
- **Villa Campito** (raíz de este repo): la app (Node) + su base de datos
  MySQL, en contenedores propios, conectados a la red `proxy` del Caddy
  compartido.
- Cada proyecto futuro repite el mismo patrón: su propio
  `docker-compose.yml`, conectado a `proxy`, con su archivo
  `sites/<proyecto>.caddy` en el Caddy compartido.

---

## 0. Requisitos previos

- Cuenta en Hetzner Cloud.
- Dominio(s) ya comprados (p. ej. `villacampito.com`), con acceso a su
  configuración DNS.
- Este repositorio subido a un repo Git (GitHub privado recomendado), para
  poder hacer `git pull` en el servidor.

---

## 1. Crear el servidor

1. En Hetzner Cloud, crea un servidor:
   - Imagen: **Ubuntu 24.04**.
   - Tipo: **CX22** (2 vCPU / 4 GB RAM / 40 GB) es suficiente.
   - Región: cualquiera en Europa (Falkenstein/Helsinki).
   - Añade tu clave SSH pública durante la creación.
2. Apunta tu(s) dominio(s) a la IP pública del servidor:
   - Registro `A` de `villacampito.com` → IP del VPS.
   - Registro `A` de `www.villacampito.com` → IP del VPS (o `CNAME` a
     `villacampito.com`).

La propagación DNS puede tardar desde minutos hasta unas horas.

---

## 2. Preparar el servidor (una sola vez)

Conéctate por SSH (`ssh root@IP_DEL_VPS`) e instala Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

Crea la red compartida que usarán todos los proyectos:

```bash
docker network create proxy
```

---

## 3. Caddy compartido (proxy inverso + HTTPS, una sola vez)

Esto sirve para Villa Campito **y** para cualquier proyecto que añadas
después. Se instala fuera de cualquier repo de proyecto:

```bash
mkdir -p /opt/infra/caddy
```

Copia ahí el contenido de `deploy/infra-caddy/` de este repo
(`docker-compose.yml`, `Caddyfile`, carpeta `sites/`). Por ejemplo, desde tu
máquina:

```bash
scp -r deploy/infra-caddy/* root@IP_DEL_VPS:/opt/infra/caddy/
```

En el servidor:

```bash
cd /opt/infra/caddy
cp .env.example .env
nano .env          # rellena ACME_EMAIL con tu email real
docker compose up -d
```

Por ahora `sites/` está vacío, así que Caddy no expone nada todavía — lo
haremos en el paso 7.

---

## 4. Subir y configurar Villa Campito

En el servidor, clona el repo donde quieras alojar los proyectos, por
ejemplo `/opt/apps/villacampito`:

```bash
mkdir -p /opt/apps && cd /opt/apps
git clone <URL_DE_TU_REPO> villacampito
cd villacampito
```

Configura las variables de entorno:

```bash
cp .env.example .env
nano .env
```

Rellena al menos:

- `ADMIN_PASSWORD` — contraseña del panel `/admin`. Si quieres que funcione
  **idéntico a la versión de Manus**, usa la misma que ya tenías
  (`Villacampito2023` por defecto, o la que hayas cambiado).
- `DB_PASSWORD` y `DB_ROOT_PASSWORD` — genera valores aleatorios:
  ```bash
  openssl rand -hex 16
  ```
- Deja `DATABASE_URL` tal cual: `docker-compose.yml` la construye solo a
  partir de `DB_PASSWORD`.

---

## 5. Descargar las fotos y vídeos

**Importante** (ver README.md): las fotos/vídeos reales de la villa todavía
apuntaban a URLs firmadas de Manus que caducan el 23/02/2027. Antes de
construir la imagen, descárgalas:

```bash
node scripts/download-media.mjs
```

Si Node no está instalado en el VPS, ejecuta este script en tu ordenador y
sube la carpeta `client/public/media/` resultante (`scp`/`rsync`), o mejor:
haz commit de esos archivos al repo para que cualquier `git clone` futuro ya
los incluya.

---

## 6. Primer arranque

```bash
docker compose up -d --build
```

Esto construye la imagen (puede tardar unos minutos la primera vez), arranca
MySQL y la app, y los conecta a la red `proxy`.

Crea las tablas en la base de datos (solo la primera vez):

```bash
docker compose exec -T app pnpm exec drizzle-kit migrate
```

Comprueba que todo está arriba:

```bash
docker compose ps
docker compose logs -f app
```

---

## 7. Publicar el dominio en el Caddy compartido

Copia el archivo de ejemplo `deploy/sites/villacampito.caddy` de este repo a
`/opt/infra/caddy/sites/villacampito.caddy` en el servidor, y edítalo si tu
dominio es distinto del de ejemplo:

```bash
cp deploy/sites/villacampito.caddy /opt/infra/caddy/sites/
nano /opt/infra/caddy/sites/villacampito.caddy   # ajusta el/los dominio(s)
```

Recarga Caddy para que recoja el nuevo sitio y emita el certificado HTTPS:

```bash
cd /opt/infra/caddy
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

En 1-2 minutos, `https://villacampito.com` debería estar funcionando con
certificado válido.

---

## 8. Migrar los datos actuales (días ocupados y ofertas)

Los pasos anteriores crean las tablas **vacías**. Para que el sitio quede
idéntico al de Manus necesitas también los datos actuales:

- Días ocupados y ofertas: si tienes acceso a la base de datos MySQL actual
  de Manus (cadena de conexión o export SQL), puedes exportarlas con
  `mysqldump` y luego importarlas en el nuevo MySQL:

  ```bash
  # en tu máquina, contra la BD antigua:
  mysqldump --no-create-info --tables occupiedDates offers <bd_antigua> > datos.sql

  # subir e importar en el nuevo MySQL:
  docker compose exec -T db mysql -uvillacampito -p villacampito < datos.sql
  ```

- Si no tienes ese acceso, son pocos datos: puedes volver a introducir los
  días ocupados y las ofertas activas a mano desde `/admin` (calendario y
  pestaña de ofertas).

---

## 9. Día a día: cambios y redeploys

Cuando se modifique el código (con Claude Code o este chat), en el VPS:

```bash
cd /opt/apps/villacampito
./deploy.sh
```

Esto hace `git pull`, reconstruye la imagen, reinicia los contenedores y
aplica migraciones nuevas si las hubiera.

---

## 10. Añadir otro proyecto/dominio más adelante

1. Sube el nuevo proyecto a `/opt/apps/<otro-proyecto>` con su propio
   `Dockerfile` + `docker-compose.yml` (mismo patrón: red externa `proxy`,
   `container_name` único).
2. Crea `sites/<otro-proyecto>.caddy` en `/opt/infra/caddy/sites/` con su
   dominio y `reverse_proxy <container_name>:<puerto>`.
3. `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`.

No hace falta tocar nada de Villa Campito ni del Caddy compartido más allá
de eso.

---

## Notas para que sea "idéntico a Manus"

- El comportamiento de la web pública, el panel `/admin`, el calendario y
  las ofertas es el mismo código de siempre; lo que se quitó de Manus en la
  sesión anterior eran solo piezas internas de infraestructura (OAuth, chat
  de IA, almacenamiento), no funcionalidad visible.
- La contraseña de `/admin` y los datos de calendario/ofertas dependen solo
  de **configuración** (`.env` y la migración de datos del paso 8), no del
  código.
- Las analíticas (Umami) las proporcionaba Manus; si quieres mantenerlas,
  necesitas tu propia instancia de Umami y configurar
  `VITE_ANALYTICS_ENDPOINT` / `VITE_ANALYTICS_WEBSITE_ID` (ver
  `.env.example`) antes de `docker compose up -d --build`.
