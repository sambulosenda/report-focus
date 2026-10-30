#!/bin/sh
# Scheduled jobs for the "cron" machine on Fly.io. Times are in SITE_TIMEZONE.
#   - The day's newsletters, weekdays at NEWSLETTER_TIME (default 06:30). Each edition goes out at most once a day, so retries are safe.
#   - A database backup every night at 02:15, only when BACKUP_S3_BUCKET is set (this machine's disk is wiped on restart).
set -eu
time="${NEWSLETTER_TIME:-06:30}"
hour="${time%%:*}"
minute="${time##*:}"
app_url="https://${FLY_APP_NAME}.fly.dev"

{
  echo "CRON_TZ=${SITE_TIMEZONE:-America/New_York}"
  echo "${minute#0} ${hour#0} * * 1-5 curl -fsS --retry 3 --retry-delay 30 -X POST -H \"Authorization: Bearer \$CRON_SECRET\" ${app_url}/api/newsletter/send"
  if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    echo "15 2 * * * cd /app && npx tsx scripts/backup.ts && rm -rf backups"
  fi
} > /tmp/crontab

echo "Scheduled jobs:"
cat /tmp/crontab
exec supercronic /tmp/crontab
