# Base image
FROM node:24-slim AS base

# Set NX environment variables globally for all stages
ENV NX_DAEMON=false
ENV NX_CACHE_DIRECTORY=/tmp/nx-cache

# Stage: Install dependencies
FROM base AS deps
RUN apt-get update && apt-get install -y \
    libc6 \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package management files ONLY to optimize caching
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Stage: Builder
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run build for the dashboard
# The NX_DAEMON=false env var is already inherited from base
RUN npx nx reset && npx nx build dashboard --prod --verbose

# Stage: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Copy built assets from builder
COPY --from=builder /app/dist/apps/dashboard/public ./public
# Note: In production builds with standalone, nextjs requires certain files to be present.
# The standalone output includes its own node_modules if configured, but here we copy what's needed.
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/dashboard/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
