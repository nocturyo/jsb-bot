# Używamy lekkiej bazy z Node 22
FROM node:22-alpine AS base
WORKDIR /app

# Zależności (cache-friendly)
COPY package*.json ./
RUN npm ci

# Skopiuj źródła i zbuduj TS -> JS
COPY . .
RUN npm run build

# Finalny obraz (też alpine)
FROM node:22-alpine
WORKDIR /app

# Kopiujemy tylko to, co potrzebne do runtime
COPY --from=base /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=base /app/dist ./dist
COPY --from=base /app/.env.example ./.env.example

# Tworzymy katalogi na dane/logi (będą podpinane jako wolumeny)
RUN mkdir -p /app/data /app/logs

# Zmienne środowiskowe domyślne (możesz nadpisać w compose)
ENV NODE_ENV=production \
    LOG_LEVEL=info

# Start bota (prod)
CMD ["node", "dist/src/index.js"]
