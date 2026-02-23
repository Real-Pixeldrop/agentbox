/**
 * Workspace management utilities for AgentBox
 * Handles agent workspace setup and file operations
 */

export interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
}

export function generateAgentWorkspaceFiles(agent: {
  id: string;
  name: string;
  description?: string;
  tone?: string;
  industry?: string;
  skills: string[];
}): WorkspaceFile[] {
  const files: WorkspaceFile[] = [];

  // Generate SOUL.md
  const soulContent = `# SOUL.md - ${agent.name}

## Identity
You are ${agent.name}, ${agent.description || 'an AI assistant'}.
You work autonomously to help your human with their daily tasks.

## Personality
${agent.tone === 'formal' ? '- Professional and formal communication style' : 
  agent.tone === 'friendly' ? '- Friendly and approachable' : 
  '- Direct and to-the-point'}
- Proactive — anticipate needs before being asked
- Reliable and consistent in your responses

## Communication Style
- Use clear, structured messages
- Provide context for recommendations
- Be concise unless detail is requested

## Industry Focus
${agent.industry ? `- Specialized in ${agent.industry}` : '- General purpose assistant'}

## Skills
${agent.skills.map(skill => `- ${skill}`).join('\n')}

## Constraints
- Never share confidential information
- Escalate complex decisions to the human
- Respect boundaries and privacy

## Goals
- Provide excellent assistance
- Maintain organized workflow
- Build trust through reliability

## Workspace
Your workspace is located at: ~/workspace/${agent.id}/
You have read/write access to organize files and data.`;

  files.push({
    name: 'SOUL.md',
    path: `SOUL.md`,
    content: soulContent
  });

  // Generate MEMORY.md
  const memoryContent = `# MEMORY.md - Long-term Memory

## Context
- Agent: ${agent.name}
- Created: ${new Date().toISOString().split('T')[0]}
- ID: ${agent.id}

## User Profile
- No user interactions recorded yet
- This section will be populated as the agent learns

## Key Learnings
- No significant learnings recorded yet
- This file will be updated as the agent gains experience

## Behavioral Patterns
- Awaiting first interactions to establish patterns

## Important Notes
- Add important context and learnings here
- This memory persists across sessions
- Regular updates help maintain context continuity`;

  files.push({
    name: 'MEMORY.md',
    path: `MEMORY.md`,
    content: memoryContent
  });

  // Generate TOOLS.md
  const toolsContent = `# TOOLS.md - Available Tools

## Configured Skills
${agent.skills.length > 0 ? agent.skills.map(skill => `- ${skill}: Enabled`).join('\n') : '- No specific skills configured yet'}

## Core Capabilities
- Text analysis and generation
- Task planning and execution
- Information research and synthesis
- File operations within workspace
- Communication via configured channels

## Workspace Access
- Read/Write access to agent workspace
- File creation, modification, and organization
- Memory file management
- Session state persistence

## Communication Channels
- WebSocket connection for real-time interaction
- Session-based conversation management
- Multi-channel support (when configured)

## Usage Notes
- Tools are automatically available to the agent
- Configuration is managed through the AgentBox interface
- Workspace operations are sandboxed to agent directory`;

  files.push({
    name: 'TOOLS.md',
    path: `TOOLS.md`,
    content: toolsContent
  });

  return files;
}

/**
 * Generate initial daily memory file
 */
export function generateDailyMemoryFile(date: Date, agentName: string): WorkspaceFile {
  const dateStr = date.toISOString().split('T')[0];
  
  const content = `# Daily Memory - ${dateStr}

## Session Summary
Agent ${agentName} initialized on ${dateStr}.
No user interactions recorded yet.

## Key Events
- Agent workspace created
- Initial configuration loaded
- Ready for first interaction

## Learning Notes
- Awaiting first user interaction
- Will record significant events and patterns

## Context for Tomorrow
- Fresh start - no prior context to carry forward

## Performance Metrics
- Messages processed: 0
- Tasks completed: 0
- User satisfaction: Not measured yet`;

  return {
    name: `${dateStr}.md`,
    path: `memory/${dateStr}.md`,
    content
  };
}

/**
 * Generate agent configuration for gateway deployment
 */
export function generateGatewayAgentConfig(agent: {
  id: string;
  name: string;
  description?: string;
  tone?: string;
  industry?: string;
  skills: string[];
}, workspacePath: string) {
  const soulContent = generateAgentWorkspaceFiles(agent)[0].content;
  
  return {
    id: agent.id,
    name: agent.name,
    'SOUL.md': soulContent,
    skills: agent.skills,
    enabled: true,
    workspace: `${workspacePath}/${agent.id}`,
    model: {
      primary: 'anthropic/claude-sonnet-4-20250514'
    },
    contextTokens: 200000
  };
}