#!/usr/bin/env bash
set -euo pipefail

# Stop the cloudflared process started by run-cloudflared-capture.sh
# Usage:
#   ./scripts/stop-cloudflared.sh            # uses ~/.cloudflared/cloudflared.pid
#   ./scripts/stop-cloudflared.sh /path/to/pidfile

PIDFILE="${1:-$HOME/.cloudflared/cloudflared.pid}"

if [ ! -f "$PIDFILE" ]; then
  echo "No pidfile found at $PIDFILE"
  exit 1
fi

PID=$(cat "$PIDFILE" 2>/dev/null || echo "")
if [ -z "$PID" ]; then
  echo "Pidfile is empty: $PIDFILE"
  rm -f "$PIDFILE" 2>/dev/null || true
  exit 1
fi

if ! [[ "$PID" =~ ^[0-9]+$ ]]; then
  echo "Pidfile does not contain a numeric PID: '$PID'"
  exit 1
fi

if ! kill -0 "$PID" 2>/dev/null; then
  echo "Process $PID is not running. Removing stale pidfile."
  rm -f "$PIDFILE" 2>/dev/null || true
  exit 0
fi

# Check process command to avoid accidentally killing unrelated processes
CMD=$(ps -p "$PID" -o comm= 2>/dev/null || true)
echo "Found process $PID: $CMD"
if [ -n "$CMD" ] && ! echo "$CMD" | grep -iq "cloudflared"; then
  echo "Warning: process $PID does not look like cloudflared ('$CMD'). Aborting to avoid killing the wrong process."
  exit 1
fi

echo "Sending SIGTERM to $PID"
kill "$PID" 2>/dev/null || true

# Wait up to 10 seconds for graceful shutdown
for i in $(seq 1 10); do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "Process $PID exited cleanly"
    rm -f "$PIDFILE" 2>/dev/null || true
    exit 0
  fi
  sleep 1
done

echo "Process $PID still running after SIGTERM; sending SIGKILL"
kill -9 "$PID" 2>/dev/null || true
sleep 1
if kill -0 "$PID" 2>/dev/null; then
  echo "Failed to kill process $PID"
  exit 1
else
  echo "Process $PID killed. Removing pidfile."
  rm -f "$PIDFILE" 2>/dev/null || true
  exit 0
fi
