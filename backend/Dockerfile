FROM --platform=linux/amd64 node:18-bookworm

WORKDIR /app

# Install OpenSSL development libraries
RUN apt-get update && \
    apt-get install -y openssl libssl3 libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set OpenSSL library path explicitly
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
# Force library engine instead of binary engine
ENV PRISMA_CLIENT_ENGINE_TYPE=library
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client and verify engines exist
RUN npx prisma generate && \
    echo "=== Prisma engines generated ===" && \
    ls -la node_modules/.prisma/client/ && \
    echo "=== Testing engine loading ===" && \
    node -e "const { PrismaClient } = require('@prisma/client'); console.log('PrismaClient imported successfully');"

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]
