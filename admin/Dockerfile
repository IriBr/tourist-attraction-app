FROM node:18-slim AS builder

WORKDIR /app

# Copy shared package and build it first
COPY shared/package*.json ./shared/
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
WORKDIR /app/shared
RUN npm install && npm run build

# Copy admin and install with link to shared
WORKDIR /app/admin
COPY admin/package*.json ./

# Update package.json to use file reference instead of workspace
RUN sed -i 's/"@tourist-app\/shared": "workspace:\*"/"@tourist-app\/shared": "file:..\/shared"/' package.json

# Install dependencies
RUN npm install

# Copy admin source
COPY admin/ ./

# Build admin with API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

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
