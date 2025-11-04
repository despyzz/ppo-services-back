# Production-ready Node.js Express + SQLite Dockerfile
FROM node:lts-alpine

WORKDIR /app

# Копируем только package.json сначала, чтобы использовать кеш
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Копируем весь код, статику, миграции и т.д.
COPY . .

# Обеспечиваем папки для volume (долговременное хранение)
RUN mkdir -p db documents images && chown -R node:node db documents images

USER node
EXPOSE 3000

# Запуск
CMD ["node", "server.js"]
