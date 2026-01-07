#!/usr/bin/env bash
set -euo pipefail

# Helper to run cloudflared with a local URL and capture the published cfargotunnel URL
# Usage: ./scripts/run-cloudflared-capture.sh

OUT_DIR="$HOME/.cloudflared"
OUTFILE="$OUT_DIR/current_tunnel_url.txt"
LOGFILE="$OUT_DIR/cloudflared-capture.log"

mkdir -p "$OUT_DIR"
rm -f "$OUTFILE"

echo "Starting cloudflared tunnel; logs -> $LOGFILE"

# Start cloudflared in background, capture combined stdout/stderr to a logfile
cloudflared tunnel --url "http://localhost:4242" > "$LOGFILE" 2>&1 &
CF_PID=$!

# Record the cloudflared PID so the process can be stopped later
PIDFILE="$OUT_DIR/cloudflared.pid"
echo "$CF_PID" > "$PIDFILE"
echo "cloudflared started (pid=$CF_PID). PID written to $PIDFILE. Waiting for public URL..."

# When this script exits, if the process no longer exists remove the pidfile to avoid stale PID
cleanup() {
  if [ -f "$PIDFILE" ]; then
    P=$(cat "$PIDFILE" 2>/dev/null || echo '')
    if [ -n "$P" ] && ! kill -0 "$P" 2>/dev/null; then
      rm -f "$PIDFILE"
    fi
  fi
}
trap cleanup EXIT

# Wait up to 60 seconds for a line containing a cfargotunnel/trycloudflare hostname
TIMEOUT=60
COUNT=0
URL_REGEX='https?://[A-Za-z0-9._-]+\.(cfargotunnel\.com|trycloudflare\.com)'

while [ $COUNT -lt $TIMEOUT ]; do
  # Use -a to force grep to treat the file as text (avoids "Binary file ... matches")
  if grep -aEo "$URL_REGEX" "$LOGFILE" -m1 >/dev/null 2>&1; then
    # Prefer a clean extraction; use head to guard against multiple matches
    URL=$(grep -aEo "$URL_REGEX" "$LOGFILE" | head -n1)
    echo "$URL" > "$OUTFILE"
    echo "Wrote public URL to $OUTFILE: $URL"
    exit 0
  fi

  # If grep still behaves oddly (some logs contain NULs), try with 'strings' as a fallback
  if command -v strings >/dev/null 2>&1; then
    if strings "$LOGFILE" | grep -Eo "$URL_REGEX" -m1 >/dev/null 2>&1; then
      URL=$(strings "$LOGFILE" | grep -Eo "$URL_REGEX" | head -n1)
      echo "$URL" > "$OUTFILE"
      echo "Wrote public URL to $OUTFILE (via strings): $URL"
      exit 0
    fi
  fi

  sleep 1
  COUNT=$((COUNT+1))
done

echo "Timed out waiting for a cfargotunnel URL. See $LOGFILE for details." >&2
echo "You can inspect the logfile: tail -n +1 $LOGFILE" >&2
exit 2
