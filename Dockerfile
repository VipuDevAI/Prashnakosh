# =============================================================================
# PRASHNAKOSH - Production Dockerfile
# Multi-stage build: compile TypeScript → build frontend → minimal runtime
# =============================================================================

# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY client/package.json ./client/

# Install all dependencies (including dev)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend (Vite)
RUN cd client && npx vite build

# Build backend (TypeScript → JavaScript)
RUN npx tsc --outDir dist/server --rootDir . --skipLibCheck || true
RUN npx esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js --external:pg-native --external:bufferutil --external:utf-8-validate

# Stage 2: Production runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Create data directories
RUN mkdir -p /data/uploads /data/exports /data/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:5000/api/health || exit 1

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start
CMD ["node", "--max-old-space-size=512", "dist/server.js"]
