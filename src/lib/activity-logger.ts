import { supabase, type ActivityLog } from './supabase';

export type ActivityType = 'email' | 'task' | 'error' | 'reminder' | 'crm' | 'agent_created' | 'agent_updated' | 'soul_updated' | 'message_sent';

export interface LogActivityParams {
  userId: string;
  agentId?: string | null;
  type: ActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Log an activity event to the database
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        agent_id: params.agentId,
        type: params.type,
        title: params.title,
        description: params.description,
        metadata: params.metadata,
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Pre-configured activity loggers for common events
 */
export const activityLoggers = {
  agentCreated: (userId: string, agentId: string, agentName: string) =>
    logActivity({
      userId,
      agentId,
      type: 'agent_created',
      title: 'Agent created',
      description: `Created new agent "${agentName}"`,
    }),

  agentUpdated: (userId: string, agentId: string, agentName: string, field: string) =>
    logActivity({
      userId,
      agentId,
      type: 'agent_updated',
      title: 'Agent updated',
      description: `Updated ${field} for agent "${agentName}"`,
    }),

  soulUpdated: (userId: string, agentId: string, agentName: string) =>
    logActivity({
      userId,
      agentId,
      type: 'soul_updated',
      title: 'Personality updated',
      description: `Updated SOUL.md for agent "${agentName}"`,
    }),

  messageSent: (userId: string, agentId: string, agentName: string, channel: string) =>
    logActivity({
      userId,
      agentId,
      type: 'message_sent',
      title: 'Message sent',
      description: `Sent message via ${channel} from agent "${agentName}"`,
      metadata: { channel },
    }),

  error: (userId: string, agentId: string | null, title: string, description: string) =>
    logActivity({
      userId,
      agentId,
      type: 'error',
      title,
      description,
    }),

  emailProcessed: (userId: string, agentId: string, agentName: string, subject: string) =>
    logActivity({
      userId,
      agentId,
      type: 'email',
      title: 'Email processed',
      description: `Processed email "${subject}" with agent "${agentName}"`,
      metadata: { subject },
    }),

  taskCompleted: (userId: string, agentId: string, agentName: string, task: string) =>
    logActivity({
      userId,
      agentId,
      type: 'task',
      title: 'Task completed',
      description: `Completed task: ${task}`,
      metadata: { task },
    }),
};