#!/bin/sh
# Starts the "app" machine on Fly.io: brings the database up to date, starts the scheduled jobs, then the website.
set -eu

# The database is a file on the Fly volume. Without the volume it would land on the machine's own disk,
# which is wiped on every restart: the site would come up empty and lose whatever was written to it.
if ! grep -q " /data " /proc/mounts; then
  echo "No volume mounted at /data. See [mounts] in fly.toml." >&2
  exit 1
fi
mkdir -p /data/db /data/image-cache

npx tsx scripts/migrate.ts

/app/deploy/cron.sh &
exec npx next start -H 0.0.0.0 -p 3000
