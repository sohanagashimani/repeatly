# Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package.json files for workspace setup
COPY package*.json turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/worker/package*.json ./packages/worker/

# Copy source files BEFORE npm install (needed for database postinstall script)
COPY packages/database/ ./packages/database/
COPY packages/worker/ ./packages/worker/

# Install dependencies
RUN npm install

# Build database package first
RUN cd packages/database && npm run build

# Build worker package
RUN cd packages/worker && npm run build

# Verify the build output exists
RUN ls -la packages/worker/dist/ || echo "Build failed - dist folder not found"
RUN ls -la packages/worker/dist/index.js || echo "index.js not found in dist"

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/worker/package*.json ./packages/worker/

# Copy database source files needed for postinstall script
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/src ./packages/database/src
COPY --from=builder /app/packages/database/tsconfig.json ./packages/database/tsconfig.json

# Install production dependencies (skip postinstall since we already have built artifacts)
RUN npm install --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/worker/dist ./packages/worker/dist

# Generate Prisma client in production stage (needed for runtime)
RUN cd packages/database && npx prisma generate

# Verify the files exist in production stage
RUN ls -la packages/worker/dist/ || echo "Production: dist folder not found"
RUN ls -la packages/worker/dist/index.js || echo "Production: index.js not found"

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep node || exit 1

# Start application
CMD ["node", "packages/worker/dist/index.js"] 