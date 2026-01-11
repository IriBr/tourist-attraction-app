FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy root package files for workspace
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Copy shared source for building
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/

# Copy backend files
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/

# Install all dependencies
RUN npm install --workspaces --include-workspace-root

# Build shared package first
RUN npm run build --workspace=shared

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build backend
RUN npm run build --workspace=backend

WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start command - with one-time admin password reset
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/scripts/reset-admin-prod.ts && node dist/index.js"]
