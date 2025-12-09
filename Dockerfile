# ------------------------------------
# Stage 1: Build Application
# ------------------------------------
FROM node:24-alpine AS builder

# Install required native package for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy Yarn configuration files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy the entire .yarn directory (Yarn Berry)
COPY .yarn/ .yarn/

# Install dependencies using Yarn
RUN yarn install --immutable

# Copy the rest of the source code
COPY . .

# Disable Next.js Telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Set executable path environment variables for build time
# (These will be overridden in the runtime stage with actual paths)
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Run the Next.js production build
RUN yarn build

# ------------------------------------
# Stage 2: Lambda Runtime with Dependencies
# ------------------------------------
FROM public.ecr.aws/lambda/nodejs:24

# Install ffmpeg and yt-dlp (using curl-minimal that's already in the image)
RUN dnf install -y tar xz \
    && curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz \
    && tar -xf /tmp/ffmpeg.tar.xz -C /tmp \
    && mv /tmp/ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ffmpeg \
    && mv /tmp/ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ffprobe \
    && chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /tmp/ffmpeg* \
    && dnf clean all

# Set executable path environment variables
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/local/bin/ffmpeg
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone Next.js build from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Lambda handler
COPY server.js ./

# Lambda handler
CMD ["server.handler"]