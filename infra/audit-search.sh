#!/usr/bin/env bash
# ============================================================================
# AgentBox - Audit Log Search
# Searches through a user's audit logs
#
# Usage: ./audit-search.sh <userId> [query] [options]
# Example: ./audit-search.sh user_abc123 "chat.send"
#          ./audit-search.sh user_abc123 "agent.create" --from 2026-02-01 --to 2026-02-28
#          ./audit-search.sh user_abc123 --action chat.send --last 7d
#          ./audit-search.sh user_abc123                    # all entries, last 7 days
#
# Options:
#   --from YYYY-MM-DD   Start date (default: 7 days ago)
#   --to YYYY-MM-DD     End date (default: today)
#   --action ACTION     Filter by action type
#   --agent AGENT_ID    Filter by agent ID
#   --last Nd           Last N days (e.g., --last 30d)
#   --json              Output raw JSON (default: formatted)
#   --count             Just show count of matching entries
# ============================================================================

set -euo pipefail

# --- Config ---
AUDIT_DIR="/data/audit"

# --- Helpers ---
die() { echo "ERROR: $*" >&2; exit 1; }

# --- Parse arguments ---
USER_ID="${1:-}"
[ -z "$USER_ID" ] && die "Usage: $0 <userId> [query] [options]"
shift

QUERY=""
FROM_DATE=""
TO_DATE=""
ACTION_FILTER=""
AGENT_FILTER=""
RAW_JSON=false
COUNT_ONLY=false

while [ $# -gt 0 ]; do
    case "$1" in
        --from)   FROM_DATE="$2"; shift 2 ;;
        --to)     TO_DATE="$2"; shift 2 ;;
        --action) ACTION_FILTER="$2"; shift 2 ;;
        --agent)  AGENT_FILTER="$2"; shift 2 ;;
        --last)
            DAYS="${2%d}"  # strip 'd' suffix
            FROM_DATE=$(date -d "-${DAYS} days" '+%Y-%m-%d' 2>/dev/null || date -v-"${DAYS}"d '+%Y-%m-%d')
            TO_DATE=$(date '+%Y-%m-%d')
            shift 2
            ;;
        --json)   RAW_JSON=true; shift ;;
        --count)  COUNT_ONLY=true; shift ;;
        -*)       die "Unknown option: $1" ;;
        *)        QUERY="$1"; shift ;;
    esac
done

# Defaults
[ -z "$FROM_DATE" ] && FROM_DATE=$(date -d "-7 days" '+%Y-%m-%d' 2>/dev/null || date -v-7d '+%Y-%m-%d')
[ -z "$TO_DATE" ] && TO_DATE=$(date '+%Y-%m-%d')

USER_AUDIT="${AUDIT_DIR}/${USER_ID}"
[ -d "$USER_AUDIT" ] || die "No audit logs found for user '${USER_ID}'"

# --- Collect matching log files ---
FILES=()
CURRENT="$FROM_DATE"
while [[ "$CURRENT" < "$TO_DATE" ]] || [[ "$CURRENT" == "$TO_DATE" ]]; do
    FILE="${USER_AUDIT}/audit-${CURRENT}.jsonl"
    GZ_FILE="${FILE}.gz"
    
    if [ -f "$FILE" ]; then
        FILES+=("$FILE")
    elif [ -f "$GZ_FILE" ]; then
        FILES+=("$GZ_FILE")
    fi
    
    # Increment date
    CURRENT=$(date -d "${CURRENT} + 1 day" '+%Y-%m-%d' 2>/dev/null || date -j -v+1d -f '%Y-%m-%d' "$CURRENT" '+%Y-%m-%d')
done

if [ ${#FILES[@]} -eq 0 ]; then
    echo "No audit logs found for ${USER_ID} between ${FROM_DATE} and ${TO_DATE}"
    exit 0
fi

# --- Build jq filter ---
JQ_FILTER="."
[ -n "$ACTION_FILTER" ] && JQ_FILTER="${JQ_FILTER} | select(.action == \"${ACTION_FILTER}\")"
[ -n "$AGENT_FILTER" ] && JQ_FILTER="${JQ_FILTER} | select(.agentId == \"${AGENT_FILTER}\")"

# --- Process files ---
process_file() {
    local file="$1"
    if [[ "$file" == *.gz ]]; then
        zcat "$file"
    else
        cat "$file"
    fi
}

RESULTS=""
for file in "${FILES[@]}"; do
    CONTENT=$(process_file "$file")
    
    # Apply jq filter
    FILTERED=$(echo "$CONTENT" | jq -c "$JQ_FILTER" 2>/dev/null || echo "$CONTENT")
    
    # Apply text search if query given
    if [ -n "$QUERY" ]; then
        FILTERED=$(echo "$FILTERED" | grep -i "$QUERY" || true)
    fi
    
    [ -n "$FILTERED" ] && RESULTS="${RESULTS}${FILTERED}"$'\n'
done

# Remove trailing newline
RESULTS="${RESULTS%$'\n'}"

if [ -z "$RESULTS" ]; then
    echo "No matching entries found."
    exit 0
fi

# --- Output ---
if [ "$COUNT_ONLY" = true ]; then
    echo "$RESULTS" | wc -l | tr -d ' '
elif [ "$RAW_JSON" = true ]; then
    echo "$RESULTS"
else
    # Formatted output
    echo ""
    echo "Audit Log - ${USER_ID} (${FROM_DATE} to ${TO_DATE})"
    printf '%.0s─' {1..60}; echo
    printf "%-20s %-12s %-20s %s\n" "Timestamp" "Agent" "Action" "Details"
    printf '%.0s─' {1..60}; echo
    
    echo "$RESULTS" | while IFS= read -r line; do
        [ -z "$line" ] && continue
        TS=$(echo "$line" | jq -r '.ts // 0')
        # Convert timestamp to readable date
        DATE=$(date -d "@${TS}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -r "$TS" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$TS")
        AGENT=$(echo "$line" | jq -r '.agentId // "-"')
        ACTION=$(echo "$line" | jq -r '.action // "-"')
        META=$(echo "$line" | jq -c '.meta // {}')
        
        printf "%-20s %-12s %-20s %s\n" "$DATE" "$AGENT" "$ACTION" "$META"
    done
    
    echo ""
    TOTAL=$(echo "$RESULTS" | wc -l | tr -d ' ')
    echo "Total entries: ${TOTAL}"
fi
