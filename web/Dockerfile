# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Drizzle needs DATABASE_URL at build time for type generation
# AUTH_SECRET needed by next-auth at build time
ARG DATABASE_URL=postgresql://prism:prism_dev_2026@host.docker.internal:5432/prism
ARG AUTH_SECRET=build-time-placeholder
ARG NEXT_PUBLIC_ANALYZER_URL=http://localhost:8001
ENV DATABASE_URL=${DATABASE_URL}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV NEXT_PUBLIC_ANALYZER_URL=${NEXT_PUBLIC_ANALYZER_URL}

RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Drizzle migrations (for entrypoint migration)
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db
COPY --from=deps /app/node_modules ./node_modules

# Entrypoint script (runs migrations before starting)
COPY docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "./docker-entrypoint.sh"]
