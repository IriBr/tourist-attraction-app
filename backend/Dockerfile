FROM node:18-bookworm

WORKDIR /app

# Install OpenSSL - Ubuntu/Debian already has it, but ensure it's there
RUN apt-get update && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client AFTER installing dependencies
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Expose port
EXPOSE 3000

# Start command - migrations handled separately
CMD ["node", "dist/index.js"]
