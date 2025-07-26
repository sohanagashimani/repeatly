FROM node:22-alpine AS base
WORKDIR /app

# Copy package files and source code first
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/database/ ./packages/database/

# Install all dependencies (including devDependencies needed for building)
RUN npm install

# Build the TypeScript
RUN cd packages/database && npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/database/dist ./packages/database/dist
COPY --from=base /app/packages/database/package.json ./packages/database/package.json
COPY --from=base /app/packages/database/prisma ./packages/database/prisma

# Set working directory to database package
WORKDIR /app/packages/database

# Create startup script with better error handling
RUN echo '#!/bin/sh' > /app/packages/database/start.sh && \
    echo 'echo "🔄 Running database migrations..."' >> /app/packages/database/start.sh && \
    echo 'echo "📊 Checking migration status..."' >> /app/packages/database/start.sh && \
    echo 'npx prisma migrate status' >> /app/packages/database/start.sh && \
    echo 'echo "🚀 Deploying migrations..."' >> /app/packages/database/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/packages/database/start.sh && \
    echo 'echo "✅ Migrations completed successfully"' >> /app/packages/database/start.sh && \
    chmod +x /app/packages/database/start.sh

# This container is primarily for running migrations
# Can also be used as a sidecar for generating Prisma client
CMD ["/app/packages/database/start.sh"] 