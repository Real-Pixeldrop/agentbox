# AgentBox Infrastructure - Multi-Tenant Security

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS (Host)                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Nginx      │  │  Clawdbot    │  │  Message Broker  │  │
│  │   :80/:443   │→ │  Gateway     │↔ │  :18793          │  │
│  │              │  │  :18789      │  │  (inter-agent)   │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────┘  │
│                           │                                  │
│        ┌──────────────────┼───────────────────┐              │
│        │ Docker           │                   │              │
│        │                  ▼                   ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Container   │  │  Container   │  │  Container   │        │
│  │  user-abc    │  │  user-def    │  │  user-xyz    │        │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │       │
│  │  │ Agent  │  │  │  │ Agent  │  │  │  │ Agent  │  │       │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │       │
│  │  1GB/1CPU    │  │  1GB/1CPU    │  │  1GB/1CPU    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ /data/users/ │  │ /data/users/ │  │ /data/users/ │      │
│  │   abc/       │  │   def/       │  │   xyz/       │      │
│  │ ├─workspace  │  │ ├─workspace  │  │ ├─workspace  │      │
│  │ ├─memory     │  │ ├─memory     │  │ ├─memory     │      │
│  │ ├─skills     │  │ ├─skills     │  │ ├─skills     │      │
│  │ ├─config     │  │ ├─config     │  │ ├─config     │      │
│  │ └─logs       │  │ └─logs       │  │ └─logs       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/opt/agentbox/infra/          # Scripts & services (deployed from this repo)
├── Dockerfile                # Base image for user containers
├── provision-user.sh         # Create user container + workspace
├── teardown-user.sh          # Remove user container + cleanup
├── usage-report.sh           # Display user stats
├── audit-search.sh           # Search audit logs
├── audit-rotate.sh           # Log rotation (cron)
├── message-broker.js         # Inter-agent messaging service
├── rate-limiter.js           # Per-user rate limiting module
├── quota-tracker.js          # Token & storage quota tracking
├── audit-logger.js           # Audit logging module
├── agentbox-broker.service   # Systemd unit for message broker
└── README.md                 # This file

/data/                        # All user data (persistent)
├── users/{userId}/           # Per-user workspace
│   ├── workspace/            # Agent working files
│   ├── memory/               # MEMORY.md + daily notes
│   ├── skills/               # Custom skills
│   ├── config/               # SOUL.md, TOOLS.md (read-only in container)
│   └── logs/                 # Activity logs
├── rate-limits/{userId}.json # Rate limit counters
├── usage/{userId}/           # Token usage tracking
│   └── usage-YYYY-MM.json
├── audit/{userId}/           # Audit logs
│   └── audit-YYYY-MM-DD.jsonl
└── queues/{userId}/          # Message broker queues
```

## Security Model

### Container Isolation
- Each user gets a **dedicated Docker container** with:
  - **Read-only root filesystem** (tmpfs for /tmp and /home)
  - **Isolated network** (`--internal`, no ICC, no internet by default)
  - **Non-root user** inside container
  - **Dropped capabilities** (`--cap-drop ALL`)
  - **No privilege escalation** (`--security-opt no-new-privileges`)
  - **Resource limits**: 1GB RAM, 1 CPU, 100 PIDs max
  
### Filesystem Isolation
- Each user directory has a **unique UID** (starting at 10000)
- Config is mounted **read-only** in containers
- No cross-user filesystem access possible

### Network Isolation
- Each user has a **separate Docker network**
- `--internal` flag: no outbound internet from containers
- `enable_icc=false`: no inter-container communication
- Gateway communicates with containers via **host network** (localhost)

### Communication
- Inter-agent messaging **only within same user** (verified server-side)
- Cross-user messaging is **impossible by design**
- All messages are audited (hash only, not content)

## Rate Limiting

| Resource          | Free     | Pro      | Enterprise |
|-------------------|----------|----------|------------|
| Messages/day      | 100      | 1,000    | 10,000     |
| Tokens/day        | 50k      | 500k     | 5M         |
| Requests/minute   | 10       | 60       | 200        |
| Monthly cost cap  | $5       | $50      | $500       |
| Storage           | 1 GB     | 10 GB    | 100 GB     |
| Monthly tokens    | 5M       | 50M      | 500M       |

## Quick Start

### Deploy to VPS
```bash
# From local machine
scp -r projets/agentbox/infra/ root@76.13.61.223:/opt/agentbox/infra/

# On VPS
ssh root@76.13.61.223
cd /opt/agentbox/infra
chmod +x *.sh

# Build base image
docker build -t agentbox-base:latest .

# Setup directories
mkdir -p /data/{users,rate-limits,usage,audit,queues}

# Install message broker service
cp agentbox-broker.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now agentbox-broker

# Setup audit rotation cron
echo "0 3 * * * /opt/agentbox/infra/audit-rotate.sh >> /var/log/agentbox-audit-rotate.log 2>&1" | crontab -
```

### Provision a User
```bash
./provision-user.sh user_abc123
```

### Check Usage
```bash
./usage-report.sh user_abc123
./usage-report.sh user_abc123 2026-02  # specific month
```

### Search Audit Logs
```bash
./audit-search.sh user_abc123 "chat.send"
./audit-search.sh user_abc123 --action agent.create --last 30d
./audit-search.sh user_abc123 --json  # raw output
```

### Teardown a User
```bash
./teardown-user.sh user_abc123            # remove everything
./teardown-user.sh user_abc123 --keep-data  # keep files, remove container
```

## Integration with Existing Gateway

The existing Clawdbot gateway (`/root/.clawdbot/clawdbot.json`) is **not modified**.
The infrastructure runs alongside it:

- **Gateway** (:18789) — existing, untouched
- **Message Broker** (:18793) — new, internal only
- **Containers** — managed via Docker, communicate with gateway via localhost

To integrate, the gateway should:
1. Call `rate-limiter.checkRateLimit(userId)` before processing requests
2. Call `quota-tracker.checkQuota(userId)` before LLM calls
3. Call `quota-tracker.trackTokens(userId, agentId, {...})` after LLM calls
4. Call `audit-logger.log(userId, agentId, action, meta)` for all sensitive actions

These modules are designed as importable Node.js libraries — no gateway code changes needed,
just `require()` them where appropriate.
