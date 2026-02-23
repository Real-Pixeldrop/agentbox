# AgentBox - Base container for user agents
# Ubuntu 24.04 minimal + Node.js 22 + Python 3.12 + Clawdbot CLI
FROM ubuntu:24.04

LABEL maintainer="Pixel Drop <contact@pixel-drop.com>"
LABEL description="AgentBox user agent sandbox"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    git \
    python3.12 \
    python3-pip \
    python3.12-venv \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Clawdbot CLI (npm global)
RUN npm install -g @anthropic-ai/claude-code@latest 2>/dev/null || true

# Create non-root user (uid will be remapped per user via --user flag)
# Use GID/UID 1500 to avoid conflicts with existing ubuntu group (1000)
RUN groupadd -g 1500 agent && \
    useradd -u 1500 -g agent -m -s /bin/bash agent

# Workspace directory
RUN mkdir -p /workspace && chown agent:agent /workspace

# Default working directory
WORKDIR /workspace

# Switch to non-root user
USER agent

# Health check - simple process alive check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD pgrep -u agent > /dev/null || exit 1

# Default command - keep container alive
CMD ["sleep", "infinity"]
