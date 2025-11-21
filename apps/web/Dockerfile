FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy entire repository
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client (needed if web uses it directly or via shared package)
WORKDIR /app/packages/database
RUN npx prisma generate

# Build Web App
WORKDIR /app/apps/web
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy standalone build
# The standalone build puts everything in .next/standalone, including node_modules
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
