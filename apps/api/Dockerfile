FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy entire repository
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["pnpm", "start:prod"]
