FROM node:22-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and prisma files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma

# This container is primarily for running migrations
# Can also be used as a sidecar for generating Prisma client
CMD ["npx", "prisma", "migrate", "deploy"] 