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
# STAGE 3: Production
# ==========================================
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --chown=nodejs:nodejs package*.json ./
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

COPY --chown=nodejs:nodejs rus.traineddata ./
COPY --chown=nodejs:nodejs eng.traineddata ./

RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]