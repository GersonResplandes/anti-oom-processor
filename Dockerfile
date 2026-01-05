# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

# Set production env
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
USER node

# Expose port (default 3000)
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/index.js"]
