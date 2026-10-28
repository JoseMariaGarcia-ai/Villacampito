# Villa Campito — imagen de producción para Railway

FROM node:22-slim AS app

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copiar manifest + lockfile primero para cachear la capa de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias exactamente como en el lockfile — no resuelve el
# arbol de versiones contra el registro en cada build (eso es lo que, ante
# una incidencia de red de Railway/npm a mitad de resolucion, tumbaba el
# build con pnpm install --no-frozen-lockfile).
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Variables opcionales de Umami Analytics
ARG VITE_ANALYTICS_ENDPOINT=""
ARG VITE_ANALYTICS_WEBSITE_ID=""
ENV VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

# Compilar cliente (Vite) y servidor (esbuild)
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
