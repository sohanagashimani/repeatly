FROM node:22-alpine AS base
WORKDIR /app

# Copy .nvmrc to determine Node version
COPY .nvmrc ./

# Copy package files and source code first
COPY package*.json turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/database/ ./packages/database/

# Install all dependencies (including devDependencies needed for building)
RUN npm ci --only=production=false

# Build using Turbo
RUN npx turbo run build --filter=@repeatly/database

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy built application and Prisma schema
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