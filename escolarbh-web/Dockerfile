# ============================================================
# Multi-stage Dockerfile para EscolarBH Web (Vite/React)
# ============================================================

# Stage 1: Build Node.js
FROM node:20-alpine AS builder
WORKDIR /app

# Otimização de cache para o npm install
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Faz o build estático para a pasta "dist"
RUN npm run build

# Stage 2: Servidor Nginx (Runtime)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Limpa conteúdo padrão do Nginx
RUN rm -rf ./*

# Copia os arquivos gerados no build
COPY --from=builder /app/dist .

# Adiciona configuração customizada para fallback do SPA (React Router)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
