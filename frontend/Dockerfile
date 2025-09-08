# Multi-stage build for Next.js production with nginx
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV=production
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Install Node.js in nginx container for Next.js server
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy built Next.js application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Configure nginx to proxy to Next.js
RUN rm /etc/nginx/conf.d/default.conf
COPY <<EOF /etc/nginx/conf.d/default.conf
upstream nextjs {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy all requests to Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Create startup script
COPY <<EOF /start.sh
#!/bin/sh
# Start Next.js in background
cd /app && npm start &
# Start nginx in foreground
nginx -g "daemon off;"
EOF

RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]