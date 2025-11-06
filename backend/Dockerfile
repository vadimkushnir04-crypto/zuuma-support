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
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

COPY . .
RUN npm run build

# ==========================================
# STAGE 3: Production Runtime
# ==========================================
FROM node:20-alpine

# 🧹 минимальная утилита для чистого завершения процессов
RUN apk add --no-cache dumb-init

WORKDIR /app

# ❗ Работает от root, чтобы избежать проблем с volume правами
# (nodejs UID=1001 не сможет chmod на host volume)
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# 👇 создаём папки и выдаём полные права
RUN mkdir -p /app/uploads /app/logs && chmod -R 777 /app/uploads /app/logs

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
