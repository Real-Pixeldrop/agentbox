#!/usr/bin/env bash
# ============================================================================
# AgentBox - Provision User
# Creates a Docker container + workspace + config for a new user
#
# Usage: ./provision-user.sh <userId>
# Example: ./provision-user.sh user_abc123
#
# What it does:
#   1. Creates /data/users/{userId}/ with proper structure
#   2. Creates isolated Docker network for the user
#   3. Builds (if needed) and runs a sandboxed container
#   4. Sets up rate limiting, usage tracking, and audit log dirs
#   5. Assigns unique UID for filesystem isolation
# ============================================================================

set -euo pipefail

# --- Config ---
DATA_ROOT="/data"
USERS_DIR="${DATA_ROOT}/users"
RATE_LIMITS_DIR="${DATA_ROOT}/rate-limits"
USAGE_DIR="${DATA_ROOT}/usage"
AUDIT_DIR="${DATA_ROOT}/audit"
DOCKER_IMAGE="agentbox-base:latest"
CONTAINER_PREFIX="agentbox-user"
NETWORK_PREFIX="agentbox-net"

# Resource limits
MEMORY_LIMIT="1g"
CPU_LIMIT="1.0"
STORAGE_LIMIT="5g"  # Note: enforced via quota, not Docker directly on overlay2
PIDS_LIMIT=100

# --- Helpers ---
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# --- Validate input ---
USER_ID="${1:-}"
[ -z "$USER_ID" ] && die "Usage: $0 <userId>"

# Sanitize userId (alphanumeric + underscore + hyphen only)
[[ "$USER_ID" =~ ^[a-zA-Z0-9_-]+$ ]] || die "Invalid userId: only alphanumeric, underscore, hyphen allowed"

CONTAINER_NAME="${CONTAINER_PREFIX}-${USER_ID}"
NETWORK_NAME="${NETWORK_PREFIX}-${USER_ID}"
USER_DIR="${USERS_DIR}/${USER_ID}"

# --- Check prerequisites ---
command -v docker &>/dev/null || die "Docker is not installed"
docker info &>/dev/null || die "Docker daemon is not running"

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    die "Container '$CONTAINER_NAME' already exists. Run teardown-user.sh first."
fi

# --- Build image if needed ---
if ! docker image inspect "$DOCKER_IMAGE" &>/dev/null; then
    log "Building Docker image '$DOCKER_IMAGE'..."
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    docker build -t "$DOCKER_IMAGE" "$SCRIPT_DIR" || die "Failed to build Docker image"
fi

# --- Generate unique UID for this user ---
# Base UID starts at 10000, increment based on existing user count
if [ -d "${USERS_DIR}" ] && [ "$(find "${USERS_DIR}" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)" -gt 0 ]; then
    EXISTING_USERS=$(find "${USERS_DIR}" -maxdepth 1 -mindepth 1 -type d | wc -l)
else
    EXISTING_USERS=0
fi
USER_UID=$((10000 + EXISTING_USERS))

# Ensure UID is not already taken
while getent passwd "$USER_UID" &>/dev/null 2>&1; do
    USER_UID=$((USER_UID + 1))
done

log "Provisioning user '$USER_ID' (UID: $USER_UID)..."

# --- Create directory structure ---
log "Creating workspace directories..."
mkdir -p "${USER_DIR}"/{workspace,memory,skills,config,logs}
mkdir -p "${RATE_LIMITS_DIR}"
mkdir -p "${USAGE_DIR}/${USER_ID}"
mkdir -p "${AUDIT_DIR}/${USER_ID}"

# Set ownership to unique UID
chown -R "${USER_UID}:${USER_UID}" "${USER_DIR}"
chmod -R 750 "${USER_DIR}"

# --- Initialize config files ---

# Default SOUL.md
if [ ! -f "${USER_DIR}/config/SOUL.md" ]; then
    cat > "${USER_DIR}/config/SOUL.md" <<'EOF'
# Agent Configuration

You are an AI assistant running on AgentBox.
Follow your user's instructions and stay within your workspace.
EOF
    chown "${USER_UID}:${USER_UID}" "${USER_DIR}/config/SOUL.md"
fi

# Default TOOLS.md
if [ ! -f "${USER_DIR}/config/TOOLS.md" ]; then
    cat > "${USER_DIR}/config/TOOLS.md" <<'EOF'
# Tools

Available tools are configured by your AgentBox plan.
EOF
    chown "${USER_UID}:${USER_UID}" "${USER_DIR}/config/TOOLS.md"
fi

# Initialize rate limits
MONTH=$(date '+%Y-%m')
cat > "${RATE_LIMITS_DIR}/${USER_ID}.json" <<EOF
{
  "userId": "${USER_ID}",
  "plan": "free",
  "limits": {
    "messagesPerDay": 100,
    "tokensPerDay": 50000,
    "requestsPerMinute": 10
  },
  "counters": {
    "date": "$(date '+%Y-%m-%d')",
    "messagesUsed": 0,
    "tokensUsed": 0,
    "minuteWindow": {
      "start": 0,
      "count": 0
    }
  },
  "createdAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "updatedAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
}
EOF

# Initialize usage tracking
cat > "${USAGE_DIR}/${USER_ID}/usage-${MONTH}.json" <<EOF
{
  "userId": "${USER_ID}",
  "month": "${MONTH}",
  "agents": {},
  "totalCost": 0.0,
  "storageBytes": 0
}
EOF

# --- Create isolated Docker network ---
log "Creating isolated network '${NETWORK_NAME}'..."
docker network create \
    --driver bridge \
    --internal \
    --opt com.docker.network.bridge.enable_icc=false \
    "$NETWORK_NAME" 2>/dev/null || log "Network already exists, reusing"

# --- Run container ---
log "Starting container '${CONTAINER_NAME}'..."
docker run -d \
    --name "$CONTAINER_NAME" \
    --hostname "agent-${USER_ID}" \
    --network "$NETWORK_NAME" \
    --user "${USER_UID}:${USER_UID}" \
    --memory "$MEMORY_LIMIT" \
    --cpus "$CPU_LIMIT" \
    --pids-limit "$PIDS_LIMIT" \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=256m \
    --tmpfs /home/agent:rw,noexec,nosuid,size=64m \
    --security-opt no-new-privileges:true \
    --cap-drop ALL \
    --volume "${USER_DIR}/workspace:/workspace:rw" \
    --volume "${USER_DIR}/memory:/workspace/memory:rw" \
    --volume "${USER_DIR}/skills:/workspace/skills:rw" \
    --volume "${USER_DIR}/config:/workspace/config:ro" \
    --volume "${USER_DIR}/logs:/workspace/logs:rw" \
    --restart unless-stopped \
    --label "agentbox.user=${USER_ID}" \
    --label "agentbox.uid=${USER_UID}" \
    --label "agentbox.plan=free" \
    --label "agentbox.created=$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
    "$DOCKER_IMAGE"

# --- Verify container is running ---
sleep 2
if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    log "✅ Container '$CONTAINER_NAME' is running"
else
    die "Container failed to start. Check: docker logs $CONTAINER_NAME"
fi

# --- Write audit log entry ---
AUDIT_FILE="${AUDIT_DIR}/${USER_ID}/audit-$(date '+%Y-%m-%d').jsonl"
echo "{\"ts\":$(date +%s),\"userId\":\"${USER_ID}\",\"agentId\":\"system\",\"action\":\"user.provision\",\"meta\":{\"uid\":${USER_UID},\"container\":\"${CONTAINER_NAME}\",\"plan\":\"free\"}}" >> "$AUDIT_FILE"

# --- Summary ---
log ""
log "========================================="
log "  User provisioned successfully!"
log "========================================="
log "  User ID:     ${USER_ID}"
log "  UID:         ${USER_UID}"
log "  Container:   ${CONTAINER_NAME}"
log "  Network:     ${NETWORK_NAME}"
log "  Workspace:   ${USER_DIR}/"
log "  Limits:      ${MEMORY_LIMIT} RAM, ${CPU_LIMIT} CPU"
log "  Plan:        free"
log "========================================="
