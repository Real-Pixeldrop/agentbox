#!/usr/bin/env bash
# ============================================================================
# AgentBox - Audit Log Rotation
# Compresses logs older than 30 days, deletes logs older than 90 days.
#
# Usage: ./audit-rotate.sh
# Cron:  0 3 * * * /opt/agentbox/infra/audit-rotate.sh >> /var/log/agentbox-audit-rotate.log 2>&1
# ============================================================================

set -euo pipefail

AUDIT_DIR="/data/audit"
COMPRESS_AFTER_DAYS=30
DELETE_AFTER_DAYS=90

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

COMPRESSED=0
DELETED=0

[ -d "$AUDIT_DIR" ] || { log "No audit directory found"; exit 0; }

# Find and compress files older than 30 days
while IFS= read -r -d '' file; do
    if [ ! -f "${file}.gz" ]; then
        gzip -k "$file" && rm "$file" && COMPRESSED=$((COMPRESSED + 1))
    fi
done < <(find "$AUDIT_DIR" -name 'audit-*.jsonl' -mtime +${COMPRESS_AFTER_DAYS} -print0 2>/dev/null)

# Find and delete files older than 90 days (both .jsonl and .gz)
while IFS= read -r -d '' file; do
    rm -f "$file" && DELETED=$((DELETED + 1))
done < <(find "$AUDIT_DIR" \( -name 'audit-*.jsonl' -o -name 'audit-*.jsonl.gz' \) -mtime +${DELETE_AFTER_DAYS} -print0 2>/dev/null)

log "Rotation complete: compressed=${COMPRESSED}, deleted=${DELETED}"
