# Villa Campito — imagen de producción para Railway

FROM node:22-slim AS app

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copiar solo package.json primero (sin lockfile — se regenera en build)
COPY package.json ./

# Instalar dependencias
RUN pnpm install --no-frozen-lockfile

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
