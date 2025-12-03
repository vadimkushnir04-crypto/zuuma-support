# ==========================================
# STAGE 1: Production Dependencies
# ==========================================
FROM node:20-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./

# ✅ Установка ВСЕХ зависимостей (включая dev) для сборки
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

COPY . .

# ✅ КРИТИЧНО: Компиляция TypeScript
RUN npm run build

# ✅ Проверяем что файл создался
RUN ls -la dist/ && \
    test -f dist/main.js || (echo "ERROR: dist/main.js not found!" && exit 1)

# ==========================================
# STAGE 3: Production Runtime
# ==========================================
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# ✅ ИСПРАВЛЕНИЕ: Копируем node_modules из DEPENDENCIES (не из builder!)
COPY --from=dependencies /app/node_modules ./node_modules

# ✅ Копируем скомпилированный код из builder
COPY --from=builder /app/dist ./dist

# ✅ Копируем package.json
COPY package*.json ./

# ✅ Создаём необходимые папки
RUN mkdir -p /app/uploads /app/logs && \
    chmod -R 777 /app/uploads /app/logs

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]