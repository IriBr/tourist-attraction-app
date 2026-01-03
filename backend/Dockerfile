# Build stage
FROM node:20-bookworm AS builder

WORKDIR /app

# Copy package files
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

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build backend
RUN npm run build --workspace=backend

# Production stage
FROM node:20-bookworm-slim

# Install runtime dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package*.json ./shared/

WORKDIR /app/backend

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]
