# syntax=docker/dockerfile:1
# Production image for Fly.io (see fly.toml and the "Deploying on Fly.io" part of the README).

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Settings the build bakes in. They're not secret, so fly.toml passes them as build args.
ARG SITE_URL
ARG S3_PUBLIC_URL
ARG SITE_TIMEZONE=America/New_York
ARG NEXT_PUBLIC_SITE_TIMEZONE=America/New_York
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_AD_SLOTS
ARG NEXT_PUBLIC_SOCIAL_X
ARG NEXT_PUBLIC_SOCIAL_FACEBOOK
ARG NEXT_PUBLIC_SOCIAL_INSTAGRAM
ARG NEXT_PUBLIC_SOCIAL_LINKEDIN
ARG NEXT_PUBLIC_SOCIAL_YOUTUBE
ARG NEXT_PUBLIC_SOCIAL_TIKTOK
ARG UMAMI_WEBSITE_ID
ARG WHATSAPP_CHANNEL_URL

# The real database is a file on the Fly volume, which a build can't see. So the build runs against an empty one,
# then throws away the blank pages it prepared: the server builds them from the real database on first visit.
RUN export DATABASE_URL=file:./data/build.db && \
    npm run db:migrate && npm run build && node deploy/drop-prerendered.mjs && rm -rf data

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# curl for the scheduled jobs, supercronic to run them.
ARG SUPERCRONIC_VERSION=v0.2.33
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/* && \
    arch="$(dpkg --print-architecture)" && \
    curl -fsSL -o /usr/local/bin/supercronic "https://github.com/aptible/supercronic/releases/download/${SUPERCRONIC_VERSION}/supercronic-linux-${arch}" && \
    chmod +x /usr/local/bin/supercronic
# Dev dependencies stay: the backup job runs its script with tsx.
COPY --from=build /app ./
# Resized pictures go to the volume, so a new release doesn't re-encode the whole archive on first visit.
RUN rm -rf .next/cache/images && ln -s /data/image-cache .next/cache/images
EXPOSE 3000
CMD ["/app/deploy/start.sh"]
