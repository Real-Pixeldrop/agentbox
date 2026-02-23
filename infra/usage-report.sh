#!/usr/bin/env bash
# ============================================================================
# AgentBox - Usage Report
# Displays usage statistics for a user
#
# Usage: ./usage-report.sh <userId> [month]
# Example: ./usage-report.sh user_abc123
#          ./usage-report.sh user_abc123 2026-02
#
# Shows:
#   - Current plan and rate limits
#   - Token usage (per agent and total)
#   - Storage usage
#   - Cost estimate
#   - Container resource usage
# ============================================================================

set -euo pipefail

# --- Config ---
DATA_ROOT="/data"
USERS_DIR="${DATA_ROOT}/users"
RATE_LIMITS_DIR="${DATA_ROOT}/rate-limits"
USAGE_DIR="${DATA_ROOT}/usage"
CONTAINER_PREFIX="agentbox-user"

# --- Helpers ---
die() { echo "ERROR: $*" >&2; exit 1; }
hr() { printf '%.0s─' {1..50}; echo; }
format_bytes() {
    local bytes=$1
    if [ "$bytes" -ge 1073741824 ]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc) GB"
    elif [ "$bytes" -ge 1048576 ]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc) MB"
    elif [ "$bytes" -ge 1024 ]; then
        echo "$(echo "scale=1; $bytes/1024" | bc) KB"
    else
        echo "${bytes} B"
    fi
}

# --- Validate input ---
USER_ID="${1:-}"
[ -z "$USER_ID" ] && die "Usage: $0 <userId> [month]"
MONTH="${2:-$(date '+%Y-%m')}"

CONTAINER_NAME="${CONTAINER_PREFIX}-${USER_ID}"
USER_DIR="${USERS_DIR}/${USER_ID}"
RATE_FILE="${RATE_LIMITS_DIR}/${USER_ID}.json"
USAGE_FILE="${USAGE_DIR}/${USER_ID}/usage-${MONTH}.json"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          AgentBox Usage Report                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  User:  ${USER_ID}"
echo "  Month: ${MONTH}"
hr

# --- Plan & Rate Limits ---
echo "📋 Plan & Rate Limits"
hr
if [ -f "$RATE_FILE" ]; then
    PLAN=$(jq -r '.plan // "unknown"' "$RATE_FILE")
    MSG_LIMIT=$(jq -r '.limits.messagesPerDay // "N/A"' "$RATE_FILE")
    TOK_LIMIT=$(jq -r '.limits.tokensPerDay // "N/A"' "$RATE_FILE")
    RPM_LIMIT=$(jq -r '.limits.requestsPerMinute // "N/A"' "$RATE_FILE")
    MSG_USED=$(jq -r '.counters.messagesUsed // 0' "$RATE_FILE")
    TOK_USED=$(jq -r '.counters.tokensUsed // 0' "$RATE_FILE")
    
    echo "  Plan:              ${PLAN}"
    echo "  Messages today:    ${MSG_USED} / ${MSG_LIMIT}"
    echo "  Tokens today:      ${TOK_USED} / ${TOK_LIMIT}"
    echo "  Rate limit:        ${RPM_LIMIT} req/min"
    
    # Percentage bars
    if [ "$MSG_LIMIT" != "N/A" ] && [ "$MSG_LIMIT" -gt 0 ]; then
        PCT=$(( MSG_USED * 100 / MSG_LIMIT ))
        BAR_LEN=$(( PCT / 5 ))
        BAR=$(printf '█%.0s' $(seq 1 $BAR_LEN 2>/dev/null) 2>/dev/null || echo "")
        EMPTY=$(printf '░%.0s' $(seq 1 $((20 - BAR_LEN)) 2>/dev/null) 2>/dev/null || echo "")
        echo "  Messages:          [${BAR}${EMPTY}] ${PCT}%"
    fi
else
    echo "  (no rate limit data found)"
fi
hr

# --- Token Usage ---
echo "🔢 Token Usage (${MONTH})"
hr
if [ -f "$USAGE_FILE" ]; then
    # Per-agent breakdown
    AGENTS=$(jq -r '.agents | keys[]' "$USAGE_FILE" 2>/dev/null || echo "")
    if [ -n "$AGENTS" ]; then
        printf "  %-15s %12s %12s %10s\n" "Agent" "Input" "Output" "Cost"
        printf "  %-15s %12s %12s %10s\n" "─────" "─────" "──────" "────"
        while IFS= read -r agent; do
            IN=$(jq -r ".agents[\"$agent\"].inputTokens // 0" "$USAGE_FILE")
            OUT=$(jq -r ".agents[\"$agent\"].outputTokens // 0" "$USAGE_FILE")
            COST=$(jq -r ".agents[\"$agent\"].cost // 0" "$USAGE_FILE")
            printf "  %-15s %12s %12s %9s$\n" "$agent" "$IN" "$OUT" "$COST"
        done <<< "$AGENTS"
        echo ""
    else
        echo "  (no agent usage recorded)"
    fi
    
    TOTAL_COST=$(jq -r '.totalCost // 0' "$USAGE_FILE")
    STORAGE=$(jq -r '.storageBytes // 0' "$USAGE_FILE")
    echo "  Total cost:        \$${TOTAL_COST}"
    echo "  Storage tracked:   $(format_bytes "$STORAGE")"
else
    echo "  (no usage data for ${MONTH})"
fi
hr

# --- Actual Storage ---
echo "💾 Disk Usage"
hr
if [ -d "$USER_DIR" ]; then
    ACTUAL_SIZE=$(du -sb "$USER_DIR" 2>/dev/null | cut -f1)
    echo "  Workspace:         $(format_bytes "$ACTUAL_SIZE")"
    
    # Breakdown by subdirectory
    for subdir in workspace memory skills config logs; do
        if [ -d "${USER_DIR}/${subdir}" ]; then
            SUBSIZE=$(du -sb "${USER_DIR}/${subdir}" 2>/dev/null | cut -f1)
            printf "    %-16s %s\n" "${subdir}/" "$(format_bytes "$SUBSIZE")"
        fi
    done
else
    echo "  (user directory not found)"
fi
hr

# --- Container Status ---
echo "🐳 Container Status"
hr
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER_NAME"; then
    STATUS=$(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null)
    CREATED=$(docker inspect --format '{{.Created}}' "$CONTAINER_NAME" 2>/dev/null | cut -c1-19)
    
    echo "  Container:         ${CONTAINER_NAME}"
    echo "  Status:            ${STATUS}"
    echo "  Created:           ${CREATED}"
    
    if [ "$STATUS" = "running" ]; then
        # Live resource usage
        STATS=$(docker stats --no-stream --format '{{.MemUsage}}\t{{.CPUPerc}}\t{{.PIDs}}' "$CONTAINER_NAME" 2>/dev/null || echo "N/A\tN/A\tN/A")
        MEM=$(echo "$STATS" | cut -f1)
        CPU=$(echo "$STATS" | cut -f2)
        PIDS=$(echo "$STATS" | cut -f3)
        echo "  Memory:            ${MEM}"
        echo "  CPU:               ${CPU}"
        echo "  Processes:         ${PIDS}"
    fi
else
    echo "  Container:         not found"
fi
hr
echo ""
