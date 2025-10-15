FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости с legacy-peer-deps
RUN npm ci --legacy-peer-deps

# Копируем исходный код
COPY . .

# Билдим приложение
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production --legacy-peer-deps

# Копируем билд из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Создаем директорию для uploads
RUN mkdir -p /app/uploads

# Экспортируем порт
EXPOSE 8000

# Запускаем приложение
CMD ["node", "dist/main.js"]