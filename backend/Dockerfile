# ── Etapa de build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Etapa de desarrollo (hot-reload) ─────────────────────────────────────────
FROM node:22-alpine AS development
WORKDIR /app
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ── Etapa de producción (debe ir al final para Railway) ───────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/infrastructure/server/index.js"]
