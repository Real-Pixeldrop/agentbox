/**
 * Gateway file operations utilities
 * Since the gateway doesn't have direct file system endpoints,
 * we simulate file operations using the config system and agent memory
 */

import type { GatewayClient } from './gateway';

export interface FileContent {
  path: string;
  content: string;
  lastModified: string;
}

export class GatewayFileManager {
  constructor(private gateway: GatewayClient) {}

  /**
   * Read a file from the agent's workspace
   * For now, we'll simulate this by returning generated content
   */
  async readFile(agentId: string, filePath: string): Promise<string> {
    try {
      // For now, we generate content based on the file type
      // In a real implementation, this would query the gateway for file content
      return this.generateFileContent(agentId, filePath);
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write a file to the agent's workspace
   * For now, we'll store important files in the agent's config
   */
  async writeFile(agentId: string, filePath: string, content: string): Promise<void> {
    try {
      if (filePath === 'SOUL.md') {
        // SOUL.md is stored in the agent config
        await this.updateAgentConfig(agentId, { 'SOUL.md': content });
      } else {
        // For other files, we'd need a different storage mechanism
        // For now, we'll simulate the write operation
        console.log(`[SIMULATED] Writing to ${filePath} for agent ${agentId}`);
      }
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in the agent's workspace
   */
  async listFiles(agentId: string, directory = ''): Promise<string[]> {
    // For now, return a standard set of files
    const baseFiles = ['SOUL.md', 'MEMORY.md', 'TOOLS.md'];
    
    // Add daily memory files for the last 7 days
    const today = new Date();
    const dailyFiles = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyFiles.push(`memory/${dateStr}.md`);
    }

    if (directory === 'memory') {
      return dailyFiles.map(f => f.replace('memory/', ''));
    }

    return directory === '' ? [...baseFiles, ...dailyFiles] : [];
  }

  /**
   * Update agent configuration
   */
  private async updateAgentConfig(agentId: string, updates: Record<string, any>): Promise<void> {
    const config = await this.gateway.send('config.get', {});
    const agents = (config as any)?.agents?.list || [];
    
    const agentIndex = agents.findIndex((a: any) => a.id === agentId);
    if (agentIndex === -1) {
      throw new Error(`Agent ${agentId} not found in gateway config`);
    }

    agents[agentIndex] = { ...agents[agentIndex], ...updates };

    const newConfig = {
      ...(config as Record<string, any>),
      agents: {
        ...((config as any)?.agents || {}),
        list: agents
      }
    };

    await this.gateway.send('config.apply', newConfig);
  }

  /**
   * Generate file content based on file path and agent ID
   */
  private generateFileContent(agentId: string, filePath: string): string {
    const today = new Date().toISOString().split('T')[0];
    
    if (filePath === 'MEMORY.md') {
      return `# MEMORY.md - Long-term Memory

## Context
- Agent ID: ${agentId}
- Last updated: ${today}

## Key Learnings
- No significant learnings recorded yet
- This file will be updated as the agent gains experience

## User Interactions
- Interaction patterns will be recorded here
- Important conversations and outcomes

## System Notes
- This is a simulated memory file
- Real implementation would store actual agent memories
- Content would persist across sessions

## Important Context
- Add critical information that should persist
- Business rules, user preferences, important decisions
- Historical context that affects future interactions`;
    }

    if (filePath === 'TOOLS.md') {
      return `# TOOLS.md - Available Tools

## Core Tools
- Text analysis and generation
- Task planning and execution
- Information research and synthesis
- File operations within workspace
- Session state management

## Communication
- Real-time WebSocket connection
- Multi-channel support (when configured)
- Session-based conversation tracking

## Workspace Access
- Read/Write access to agent directory: /root/agentbox-workspace/${agentId}
- Memory file management
- Configuration updates via gateway API

## Usage Statistics
- Tool usage will be tracked here
- Performance metrics and optimization notes

## Configuration
- Tools are automatically available
- Managed through AgentBox interface
- Custom tool integration available`;
    }

    // Handle daily memory files
    if (filePath.match(/^memory\/\d{4}-\d{2}-\d{2}\.md$/)) {
      const date = filePath.replace('memory/', '').replace('.md', '');
      return `# Daily Memory - ${date}

## Session Summary
No activities recorded for this date.

## Key Events
- 

## User Interactions
- 

## Tasks Completed
- 

## Learning Notes
- 

## Context for Next Session
- `;
    }

    return `# ${filePath}

This file is managed by the AgentBox system.
Content will be populated based on agent activities and user interactions.

Last generated: ${today}
Agent ID: ${agentId}`;
  }
}

/**
 * Create a file manager instance for the current gateway
 */
export function createGatewayFileManager(gateway: GatewayClient): GatewayFileManager {
  return new GatewayFileManager(gateway);
}