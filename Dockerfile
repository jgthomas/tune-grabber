# ------------------------------------
# Stage 1: Base & Dependencies (Yarn Berry Install)
# ------------------------------------
FROM node:24-alpine AS base

# Install required native package for Alpine compatibility
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Copy Yarn configuration files
COPY package.json yarn.lock .yarnrc.yml ./

# 2. IMPORTANT: Copy the entire .yarn directory and its contents separately
# This ensures the yarn binary and cache files are correctly transferred.
COPY .yarn/ .yarn/

# Install dependencies using Yarn. 
RUN yarn install --immutable

# ------------------------------------
# Stage 2: Build Application
# ------------------------------------
FROM base AS builder

# Copy the rest of the source code
COPY . .

# IMPORTANT: Disable Next.js Telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Run the Next.js production build using 'yarn build'
RUN yarn run build

# ------------------------------------
# Stage 3: Final Production Runner (Minimal & Secure)
# ------------------------------------
# Use the minimal, non-root user image for production
FROM node:24-slim AS runner

# Install ffmpeg and yt-dlp static binary
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ffmpeg ca-certificates\
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory to the standalone output folder
WORKDIR /app

# Copy only the files needed for runtime from the builder stage, owned by the non-root user
# 1. The standalone server files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 2. Public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 3. Static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set up the .next directory and ensure correct ownership
RUN mkdir -p .next
RUN chown nextjs:nodejs .next
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Set environment variables for production
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0
EXPOSE 3000

# Command to start the standalone Next.js server
CMD ["node", "server.js"]