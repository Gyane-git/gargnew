#!/usr/bin/env bash
# GargDental server health check — run on production server as root or deploy user.
set -euo pipefail

echo "=== GargDental Server Health Check ==="
echo "Date: $(date)"
echo

echo "--- Memory ---"
free -h 2>/dev/null || vm_stat | head -12
echo

echo "--- Swap ---"
swapon --show 2>/dev/null || echo "(no swap configured)"
echo

echo "--- PM2 processes ---"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list || true
  echo
  echo "Restart count (look for high ↺ values = crash loop):"
  pm2 jlist 2>/dev/null | grep -E '"name"|"restart_time"|"status"' || true
else
  echo "pm2 not installed"
fi
echo

echo "--- Duplicate node/server.js processes ---"
DUPLICATES=$(pgrep -af "node.*server\.js" 2>/dev/null || true)
if [ -n "$DUPLICATES" ]; then
  COUNT=$(echo "$DUPLICATES" | wc -l | tr -d ' ')
  echo "Found $COUNT server.js process(es):"
  echo "$DUPLICATES"
  if [ "$COUNT" -gt 1 ]; then
    echo
    echo "WARNING: Multiple server.js instances detected!"
    echo "Fix: pm2 delete all && pm2 start ecosystem.config.js && pm2 save"
  fi
else
  echo "No server.js process running"
fi
echo

echo "--- Orphan next dev processes (should NOT run in production) ---"
pgrep -af "next dev" 2>/dev/null && echo "WARNING: next dev running in production!" || echo "OK — no next dev"
echo

echo "--- Port 4444 listener ---"
ss -tlnp 2>/dev/null | grep 4444 || lsof -i :4444 2>/dev/null || echo "Nothing listening on 4444"
echo

echo "--- MySQL connection count ---"
if command -v mysql >/dev/null 2>&1; then
  mysql -e "SHOW STATUS LIKE 'Threads_connected'; SHOW STATUS LIKE 'Max_used_connections';" 2>/dev/null || echo "(mysql CLI needs credentials)"
fi
echo

echo "--- Disk ---"
df -h / 2>/dev/null | tail -1
echo

echo "=== Done ==="
