# Single stage build with full Debian image
FROM node:20-bookworm

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

# Start command
CMD ["node", "dist/index.js"]
