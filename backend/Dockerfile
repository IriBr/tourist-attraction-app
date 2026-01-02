FROM node:20-alpine

WORKDIR /app

# Copy backend package files (context is repo root)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy backend source code
COPY backend/src ./src/
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
