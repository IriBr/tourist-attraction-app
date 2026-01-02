# Use Debian-based Node image for better Prisma compatibility
FROM node:20-slim

# Install OpenSSL and other dependencies
RUN apt-get update && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

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

WORKDIR /app/backend

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start command - skip migrations for now
CMD ["npm", "run", "start"]
