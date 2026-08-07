# ── Etapa 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

COPY . .
ARG VITE_API_URL=https://conectaunahdesde0-production.up.railway.app/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Etapa alternativa: Desarrollo con hot-reload ─────────────────────────────
FROM node:22-alpine AS development

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 5185
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Etapa de producción (debe ir al final para Railway) ───────────────────────
FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
