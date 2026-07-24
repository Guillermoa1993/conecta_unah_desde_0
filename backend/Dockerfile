# ── Etapa de build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Etapa de producción ───────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/backups
EXPOSE 5000
CMD ["node", "dist/infrastructure/server/index.js"]

# ── Etapa de desarrollo (hot-reload) ─────────────────────────────────────────
FROM node:22-alpine AS development
WORKDIR /app
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p /app/backups
EXPOSE 5000
CMD ["npm", "run", "dev"]