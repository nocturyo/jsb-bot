# Etap build
FROM node:22-alpine AS build
WORKDIR /app

# Instalacja zależności (cache-friendly)
COPY package*.json ./
RUN npm ci

# Skopiuj źródła i zbuduj TS -> JS
COPY . .
RUN npm run build

# Zredukuj zależności do produkcyjnych
RUN npm prune --omit=dev

# Etap finalny (runtime)
FROM node:22-alpine
WORKDIR /app

# Skopiuj tylko to, co potrzebne w runtime
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./.env.example

# Katalogi na dane/logi (montowane jako wolumeny)
RUN mkdir -p /app/data /app/logs

ENV NODE_ENV=production \
    LOG_LEVEL=info

CMD ["node", "dist/src/index.js"]
