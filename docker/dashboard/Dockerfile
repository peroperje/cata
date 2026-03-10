# Base image
FROM node:24-slim AS base

# Set environment variables
ENV NX_DAEMON=false
ENV NX_CACHE_DIRECTORY=/tmp/nx-cache
ENV CI=true

# Install system dependencies needed for Nx and build
RUN apt-get update && apt-get install -y \
    libc6 \
    python3 \
    make \
    g++ \
    git \
    procps \
    ca-certificates \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Stage: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Stage: Builder
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass build arguments for the Next.js build
ARG API_URL
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED 1

# Run build for the dashboard
RUN npx next build apps/dashboard

# Stage: Runner (Production)
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Copy built assets from builder (standard Next.js output locations)
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "apps/dashboard/server.js"]

# Stage: Dev (Development)
FROM base AS dev
WORKDIR /app

# In dev mode, we need all dependencies (including devDeps for Nx and Next.js dev server)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js dev server port
EXPOSE 3000
ENV PORT 3000

# Enable polling for hot-reloading in some environments
ENV WATCHPACK_POLLING=true

CMD ["npm", "run", "dashboard:dev"]

