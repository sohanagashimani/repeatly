# Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy .nvmrc to determine Node version
COPY .nvmrc ./

# Copy package.json files for workspace setup
COPY package*.json turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Copy source files BEFORE npm install (needed for database postinstall script)
COPY packages/database/ ./packages/database/
COPY packages/api/ ./packages/api/

# Install dependencies
RUN npm ci --only=production=false

# Build all packages using Turbo (handles dependencies automatically)
RUN npx turbo run build --filter=@repeatly/api

# Verify the build output exists
RUN ls -la packages/api/dist/ || echo "Build failed - dist folder not found"
RUN ls -la packages/api/dist/index.js || echo "index.js not found in dist"

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json files
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Copy only the Prisma schema (needed for Prisma client generation)
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Install production dependencies (skip postinstall since we already have built artifacts)
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

# Generate Prisma client in production stage (needed for runtime)
RUN cd packages/database && npx prisma generate

# Verify the files exist in production stage
RUN ls -la packages/api/dist/ || echo "Production: dist folder not found"
RUN ls -la packages/api/dist/index.js || echo "Production: index.js not found"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "packages/api/dist/index.js"] 