"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase, type Agent } from './supabase';
import { useAuth } from './AuthContext';
import { useGateway } from './GatewayContext';

/**
 * Hook that manages agents from Supabase + Gateway.
 * When gateway is connected, agents are also synced to the gateway config.
 * When gateway is disconnected, falls back to Supabase-only or demo mode.
 */
export function useAgents() {
  const { user } = useAuth();
  const { isConnected, send } = useGateway();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents from Supabase
  const fetchAgents = useCallback(async () => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setAgents((data || []) as Agent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load agents on mount and when user changes
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Create an agent in Supabase + deploy to gateway
  const createAgent = useCallback(async (agentData: {
    name: string;
    description: string;
    tone: string;
    industry: string;
    photo: string | null;
    skills: string[];
    specialInstructions?: string;
  }): Promise<Agent> => {
    if (!user) throw new Error('Not authenticated');

    const agentId = agentData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `agent-${Date.now()}`;
    const sessionKey = `agent:${agentId}:main`;

    // Build SOUL.md content
    const soulContent = [
      `# ${agentData.name}`,
      '',
      `## Role`,
      agentData.description || 'AI Assistant',
      '',
      `## Communication Style`,
      `Tone: ${agentData.tone}`,
      agentData.industry ? `Industry: ${agentData.industry}` : '',
      '',
      agentData.specialInstructions ? `## Special Instructions\n${agentData.specialInstructions}` : '',
    ].filter(Boolean).join('\n');

    // 1. Save to Supabase first
    const { data: newAgent, error: insertErr } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agentData.name,
        description: agentData.description || null,
        tone: agentData.tone,
        industry: agentData.industry || null,
        photo_url: agentData.photo || null,
        skills: agentData.skills,
        model: 'claude-sonnet-4-20250514',
        status: 'active',
        gateway_agent_id: agentId,
        gateway_session_key: sessionKey,
        config: {
          'SOUL.md': soulContent,
          skills: agentData.skills,
        },
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 2. If gateway is connected, deploy to gateway
    if (isConnected) {
      try {
        const config = await send<Record<string, unknown>>('config.get', {});
        const currentAgents = (config?.agents as Record<string, unknown>)?.list as Array<Record<string, unknown>> || [];

        const newAgentConfig = {
          id: agentId,
          name: agentData.name,
          'SOUL.md': soulContent,
          skills: agentData.skills,
          enabled: true,
        };

        const newConfig = {
          ...config,
          agents: {
            ...(config?.agents as Record<string, unknown> || {}),
            list: [...currentAgents, newAgentConfig],
          },
        };

        await send('config.apply', newConfig);
      } catch (gwErr) {
        // Gateway deploy failed — agent is still saved in Supabase
        // Update status to reflect gateway issue
        console.error('Gateway deploy failed:', gwErr);
        throw new Error(`Agent saved but gateway deploy failed: ${gwErr instanceof Error ? gwErr.message : 'Unknown error'}`);
      }
    }

    const agent = newAgent as Agent;
    setAgents(prev => [agent, ...prev]);
    return agent;
  }, [user, isConnected, send]);

  // Delete an agent from Supabase + remove from gateway
  const deleteAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    // 1. Remove from gateway if connected
    if (isConnected && agent.gateway_agent_id) {
      try {
        const config = await send<Record<string, unknown>>('config.get', {});
        const currentAgents = (config?.agents as Record<string, unknown>)?.list as Array<Record<string, unknown>> || [];

        const filteredAgents = currentAgents.filter(
          a => (a.id as string) !== agent.gateway_agent_id
        );

        const newConfig = {
          ...config,
          agents: {
            ...(config?.agents as Record<string, unknown> || {}),
            list: filteredAgents,
          },
        };

        await send('config.apply', newConfig);
      } catch (gwErr) {
        console.error('Gateway removal failed:', gwErr);
        // Continue with Supabase deletion anyway
      }
    }

    // 2. Delete from Supabase
    const { error: deleteErr } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (deleteErr) throw deleteErr;

    setAgents(prev => prev.filter(a => a.id !== agentId));
  }, [agents, isConnected, send]);

  // Update agent status
  const updateAgentStatus = useCallback(async (agentId: string, status: 'active' | 'inactive') => {
    const { error: updateErr } = await supabase
      .from('agents')
      .update({ status })
      .eq('id', agentId);

    if (updateErr) throw updateErr;

    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, status } : a
    ));
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    deleteAgent,
    updateAgentStatus,
  };
}
