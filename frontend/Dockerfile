FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Билдим Next.js приложение
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Устанавливаем только production зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем билд и остальное
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/next-i18next.config.js ./

# Экспортируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]