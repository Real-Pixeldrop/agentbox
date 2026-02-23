#!/usr/bin/env bash
# ============================================================================
# AgentBox - Teardown User
# Removes a user's container, network, and optionally their data
#
# Usage: ./teardown-user.sh <userId> [--keep-data]
# Example: ./teardown-user.sh user_abc123
#          ./teardown-user.sh user_abc123 --keep-data
#
# Options:
#   --keep-data   Keep user files (workspace, memory, config). Only remove
#                 container and network. Useful for account suspension.
#
# What it does:
#   1. Stops and removes the Docker container
#   2. Removes the isolated Docker network
#   3. Removes user data directories (unless --keep-data)
#   4. Cleans up rate limits and usage files
#   5. Writes final audit log entry
# ============================================================================

set -euo pipefail

# --- Config ---
DATA_ROOT="/data"
USERS_DIR="${DATA_ROOT}/users"
RATE_LIMITS_DIR="${DATA_ROOT}/rate-limits"
USAGE_DIR="${DATA_ROOT}/usage"
AUDIT_DIR="${DATA_ROOT}/audit"
CONTAINER_PREFIX="agentbox-user"
NETWORK_PREFIX="agentbox-net"

# --- Helpers ---
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*" >&2; exit 1; }
warn() { log "WARNING: $*"; }

# --- Validate input ---
USER_ID="${1:-}"
[ -z "$USER_ID" ] && die "Usage: $0 <userId> [--keep-data]"
KEEP_DATA=false
[[ "${2:-}" == "--keep-data" ]] && KEEP_DATA=true

# Sanitize
[[ "$USER_ID" =~ ^[a-zA-Z0-9_-]+$ ]] || die "Invalid userId"

CONTAINER_NAME="${CONTAINER_PREFIX}-${USER_ID}"
NETWORK_NAME="${NETWORK_PREFIX}-${USER_ID}"
USER_DIR="${USERS_DIR}/${USER_ID}"

log "Tearing down user '$USER_ID'..."
[ "$KEEP_DATA" = true ] && log "(keeping user data)"

# --- Write audit log BEFORE deletion ---
AUDIT_FILE="${AUDIT_DIR}/${USER_ID}/audit-$(date '+%Y-%m-%d').jsonl"
mkdir -p "${AUDIT_DIR}/${USER_ID}" 2>/dev/null || true
echo "{\"ts\":$(date +%s),\"userId\":\"${USER_ID}\",\"agentId\":\"system\",\"action\":\"user.teardown\",\"meta\":{\"keepData\":${KEEP_DATA}}}" >> "$AUDIT_FILE" 2>/dev/null || true

# --- Stop and remove container ---
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    log "Stopping container '${CONTAINER_NAME}'..."
    docker stop "$CONTAINER_NAME" --time 10 2>/dev/null || warn "Container was not running"
    
    log "Removing container '${CONTAINER_NAME}'..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || warn "Failed to remove container"
    log "✅ Container removed"
else
    warn "Container '$CONTAINER_NAME' not found (already removed?)"
fi

# --- Remove network ---
if docker network ls --format '{{.Name}}' | grep -qx "$NETWORK_NAME"; then
    log "Removing network '${NETWORK_NAME}'..."
    docker network rm "$NETWORK_NAME" 2>/dev/null || warn "Failed to remove network"
    log "✅ Network removed"
else
    warn "Network '$NETWORK_NAME' not found"
fi

# --- Remove data ---
if [ "$KEEP_DATA" = false ]; then
    # User workspace
    if [ -d "$USER_DIR" ]; then
        log "Removing workspace '${USER_DIR}'..."
        rm -rf "$USER_DIR"
        log "✅ Workspace removed"
    fi

    # Rate limits
    if [ -f "${RATE_LIMITS_DIR}/${USER_ID}.json" ]; then
        log "Removing rate limits..."
        rm -f "${RATE_LIMITS_DIR}/${USER_ID}.json"
    fi

    # Usage data
    if [ -d "${USAGE_DIR}/${USER_ID}" ]; then
        log "Removing usage data..."
        rm -rf "${USAGE_DIR}/${USER_ID}"
    fi

    # Audit logs (keep for 30 days even after teardown, then a cron cleans them)
    if [ -d "${AUDIT_DIR}/${USER_ID}" ]; then
        log "Archiving audit logs (will be purged after 90 days by cron)..."
        # Don't delete audit logs immediately - compliance requirement
        # Just mark them for deletion
        touch "${AUDIT_DIR}/${USER_ID}/.teardown-$(date '+%Y-%m-%d')"
    fi

    log "✅ User data removed"
else
    log "✅ User data preserved (--keep-data)"
fi

# --- Summary ---
log ""
log "========================================="
log "  User teardown complete"
log "========================================="
log "  User ID:     ${USER_ID}"
log "  Container:   removed"
log "  Network:     removed"
log "  Data:        $([ "$KEEP_DATA" = true ] && echo 'preserved' || echo 'removed')"
log "  Audit logs:  preserved (90-day retention)"
log "========================================="
