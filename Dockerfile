FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY programs ./programs
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build all packages
RUN pnpm build

# Production stage
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/types/package.json ./packages/types/
COPY packages/circuits/package.json ./packages/circuits/
COPY packages/database/package.json ./packages/database/
COPY packages/ipfs/package.json ./packages/ipfs/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/circuits/dist ./packages/circuits/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/ipfs/dist ./packages/ipfs/dist

# Create circuit build directory (circuits are compiled separately if needed)
# The build directory contains compiled Circom circuits, which are optional
# and can be generated later if needed using: cd packages/circuits && pnpm compile
RUN mkdir -p ./packages/circuits/build

# Create logs directory
RUN mkdir -p logs

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start API server
CMD ["node", "packages/api/dist/index.js"]
