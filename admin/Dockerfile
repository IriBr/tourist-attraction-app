FROM node:18-slim AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY admin/package*.json ./admin/
COPY shared/package*.json ./shared/

# Copy shared source
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/

# Copy admin source
COPY admin/ ./admin/

# Install dependencies
RUN npm install --workspaces --include-workspace-root

# Build shared first
RUN npm run build --workspace=shared

# Build admin with API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=admin

# Production stage - use nginx to serve static files
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/admin/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
RUN echo 'server { \
    listen 8080; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
