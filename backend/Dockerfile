FROM node:20-alpine

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Set Prisma binary targets
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Copy source files
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/

# Install dependencies
RUN npm install --workspaces --include-workspace-root

# Build shared package
RUN npm run build --workspace=shared

# Generate Prisma client with correct binary
RUN cd backend && npx prisma generate

# Build backend
RUN npm run build --workspace=backend

WORKDIR /app/backend

# Expose port (Railway assigns PORT automatically)
ENV PORT=3000
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
