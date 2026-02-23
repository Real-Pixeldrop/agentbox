/**
 * Gateway file operations utilities
 * Real file operations via AgentBox Files API
 */

const FILES_API_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace('wss://', 'https://').replace('ws://', 'http://') + '/files' || 'https://gateway.pixel-drop.com/files';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';

export interface FileContent {
  path: string;
  content: string;
  lastModified: string;
}

export class GatewayFileManager {
  /**
   * Read a file from the agent's workspace
   */
  async readFile(agentId: string, filePath: string): Promise<string> {
    try {
      const response = await fetch(`${FILES_API_BASE}/${agentId}?path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // File doesn't exist, return default content
          return this.generateDefaultContent(agentId, filePath);
        }
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      // If API call fails, return default content
      console.warn(`Failed to read file ${filePath}, using default:`, error);
      return this.generateDefaultContent(agentId, filePath);
    }
  }

  /**
   * Write a file to the agent's workspace
   */
  async writeFile(agentId: string, filePath: string, content: string): Promise<void> {
    try {
      const response = await fetch(`${FILES_API_BASE}/${agentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath, content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in the agent's workspace
   */
  async listFiles(agentId: string, directory = ''): Promise<string[]> {
    try {
      const response = await fetch(`${FILES_API_BASE}/${agentId}/list?dir=${encodeURIComponent(directory)}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Directory doesn't exist, return default files
          return this.getDefaultFilesList(directory);
        }
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data.files.map((file: any) => file.name);
    } catch (error) {
      console.warn(`Failed to list files in ${directory}, using defaults:`, error);
      return this.getDefaultFilesList(directory);
    }
  }

  /**
   * Generate default content for files that don't exist yet
   */
  private generateDefaultContent(agentId: string, filePath: string): string {
    const today = new Date().toISOString().split('T')[0];
    
    if (filePath === 'SOUL.md') {
      return `# SOUL.md - Identité de l'agent / Agent Identity

## Qui je suis / Who I Am
Je suis un assistant IA créé pour vous aider dans vos tâches.
I am an AI assistant created to help you with various tasks.

## Mon objectif / My Purpose
- Fournir des informations utiles et précises / Provide helpful and accurate information
- Aider à résoudre des problèmes / Assist with tasks and problem-solving
- Maintenir un ton amical et professionnel / Maintain a friendly and professional demeanor

## Directives / Guidelines
- Être utile, inoffensif et honnête / Be helpful, harmless, and honest
- Fournir des réponses réfléchies / Provide thoughtful responses
- Demander des clarifications si nécessaire / Ask for clarification when needed

Dernière mise à jour / Last updated: ${today}
Agent ID: ${agentId}`;
    }

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

Last updated: ${today}`;
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

  /**
   * Get default files list when directory doesn't exist
   */
  private getDefaultFilesList(directory: string): string[] {
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
}

/**
 * Create a file manager instance
 */
export function createGatewayFileManager(): GatewayFileManager {
  return new GatewayFileManager();
}