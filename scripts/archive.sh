#!/usr/bin/env bash
# Builds the app and uploads it as the next numbered revision in revs/<n>/ on the server.
# The live site at the server root is left untouched.
set -euo pipefail

HOST="shse.se@ssh.simply.com"
REMOTE_DIR="/var/www/shse.se/pandarchy/revs"
OUT_DIR="dist-rev"

# Find the highest existing revision number on the server
last=$(ssh "$HOST" "mkdir -p '$REMOTE_DIR' && ls -1 '$REMOTE_DIR'" | grep -E '^[0-9]+$' | sort -n | tail -1 || true)
next=$(( ${last:-0} + 1 ))
echo "Creating revision $next"

# Relative base so the copy loads its own assets from revs/<n>/ instead of the live site's
bun x tsc -b
bun x vite build --base=./ --outDir "$OUT_DIR" --emptyOutDir

rsync -avz --exclude-from='.rsync-exclude' "$OUT_DIR/" "$HOST:$REMOTE_DIR/$next/"
echo "Uploaded revision $next to $REMOTE_DIR/$next/"
