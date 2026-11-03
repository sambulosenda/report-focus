#!/usr/bin/env bash
# Checks a running site answers the way it should. Usage: scripts/smoke.sh [base-url]
set -uo pipefail
BASE="${1:-https://report-focus.fly.dev}"
fail=0

# A fresh machine rebuilds pages on first hit, so give the homepage up to two minutes.
for _ in $(seq 1 12); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE/")" = 200 ] && break
  sleep 10
done

check() { # path, expected status, optional text the body must contain
  local out code
  out=$(curl -s --max-time 30 -w $'\n%{http_code}' "$BASE$1")
  code=${out##*$'\n'}
  if [ "$code" != "$2" ]; then echo "FAIL $1: status $code, want $2"; fail=1; return; fi
  if [ -n "${3:-}" ] && ! grep -q -- "$3" <<<"$out"; then echo "FAIL $1: missing '$3'"; fail=1; return; fi
  echo "ok   $1 $code"
}

check / 200 "<title>"
check /zimbabwe 200 "Zimbabwe News"
check /zimbabwe/page/9999 404
check /tag/politics 200 'content="noindex'
check /sitemap.xml 200 "<urlset"
check /news-sitemap.xml 200 "<urlset"
check /robots.txt 200 "Sitemap:"
check /newsroom 307
exit $fail
