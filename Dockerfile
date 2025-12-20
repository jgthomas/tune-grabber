# ------------------------------------
# Stage 1: Build Application
# ------------------------------------
FROM node:24-slim AS builder

WORKDIR /app

# Copy Yarn configuration files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy the entire .yarn directory (Yarn Berry)
COPY .yarn/ .yarn/

# Install dependencies using Yarn (BuildKit cache)
RUN --mount=type=cache,target=/app/.yarn/cache \
    yarn install --immutable

# Copy the rest of the source code
COPY . .

# Disable Next.js Telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Set executable path environment variables for build time
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Run the Next.js production build (cache Next.js build artifacts)
RUN --mount=type=cache,target=/app/.next/cache \
    yarn build

# ------------------------------------
# Stage 2: Production Runtime
# ------------------------------------
FROM node:24-slim AS runner

# Install ffmpeg and yt-dlp
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ffmpeg ca-certificates python3 \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/bin/python

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy the standalone Next.js build from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set up the .next directory and ensure correct ownership
RUN mkdir -p .next
RUN chown nextjs:nodejs .next
RUN chown -R nextjs:nodejs /app

# Set executable path environment variables
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Switch to the non-root user
USER nextjs

# Set environment variables for production
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

EXPOSE 8080

# Command to start the standalone Next.js server
CMD ["node", "server.js"]
