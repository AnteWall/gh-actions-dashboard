# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Copy package files and install production dependencies
COPY --from=builder /app/package.json /app/bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy built output (both server and client assets)
COPY --from=builder /app/dist ./dist

# Copy the server.ts file for Bun
COPY --from=builder /app/server.ts ./server.ts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run with bun using the custom server
CMD ["bun", "run", "server.ts"]
