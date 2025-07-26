# Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package.json files for workspace setup
COPY package*.json turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Copy source files BEFORE npm install (needed for database postinstall script)
COPY packages/database/ ./packages/database/
COPY packages/api/ ./packages/api/

# Install dependencies
RUN npm install

# Build database package first
RUN cd packages/database && npm run build

# Build API package
RUN cd packages/api && npm run build

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

# Copy database source files needed for postinstall script
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/src ./packages/database/src
COPY --from=builder /app/packages/database/tsconfig.json ./packages/database/tsconfig.json

# Install production dependencies (skip postinstall since we already have built artifacts)
RUN npm install --omit=dev --ignore-scripts

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