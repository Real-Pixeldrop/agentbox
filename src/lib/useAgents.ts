"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase, type Agent } from './supabase';
import { useAuth } from './AuthContext';
import { useGateway } from './GatewayContext';
import { generateGatewayAgentConfig } from './workspace-utils';
import { vpsProvisionUser, vpsCreateDefaultFiles, vpsWriteFile } from './agent-files-api';

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
    language: string;
    industry: string;
    photo: string | null;
    skills: string[];
    specialInstructions?: string;
  }): Promise<Agent> => {
    if (!user) throw new Error('Not authenticated');

    // Enforce agent limit (2 max during beta, except admin)
    const ADMIN_EMAIL = 'contact@pixel-drop.com';
    const AGENT_LIMIT = 2;
    const isAdmin = user.email === ADMIN_EMAIL;

    if (!isAdmin) {
      const { count, error: countErr } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countErr) throw countErr;

      if ((count ?? 0) >= AGENT_LIMIT) {
        throw new Error('Agent limit reached (2 max during beta)');
      }
    }

    const agentId = agentData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `agent-${Date.now()}`;
    const sessionKey = `agent:${agentId}:main`;
    const lang = agentData.language || 'FR';

    // Build SOUL.md content based on language
    const soulContent = lang === 'FR'
      ? [
          `# ${agentData.name}`,
          '',
          `Tu es ${agentData.name}, un assistant IA. Tu réponds toujours en français.`,
          agentData.description ? `Tu es ${agentData.description}.` : '',
          '',
          `## Style de communication`,
          `Ton : ${agentData.tone}`,
          agentData.industry ? `Secteur : ${agentData.industry}` : '',
          '',
          agentData.specialInstructions ? `## Instructions spéciales\n${agentData.specialInstructions}` : '',
        ].filter(Boolean).join('\n')
      : [
          `# ${agentData.name}`,
          '',
          `You are ${agentData.name}, an AI assistant. You always respond in English.`,
          agentData.description ? `You are ${agentData.description}.` : '',
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
          language: lang,
          skills: agentData.skills,
        },
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 1b. Provision user workspace + seed default files on VPS
    // IMPORTANT: Write SOUL.md BEFORE sending bootstrap prompt so the agent reads the correct language
    // Use the Supabase UUID as VPS agent ID (consistent with useAgentFiles which uses supabaseAgentId)
    const vpsAgentId = (newAgent as Agent).id;
    try {
      await vpsProvisionUser(user.id);
      await vpsCreateDefaultFiles(vpsAgentId, soulContent);
      // Also create skill files
      for (const skillId of agentData.skills) {
        await vpsWriteFile(vpsAgentId, `skills/${skillId}/SKILL.md`, `# ${skillId}\n\nSkill: ${skillId}\n`);
      }
    } catch (vpsErr) {
      console.warn('VPS workspace provisioning failed (non-fatal):', vpsErr);
    }

    // 2. If gateway is connected, also write SOUL.md via gateway to ensure the running agent picks it up
    if (isConnected) {
      try {
        const config = await send<Record<string, unknown>>('config.get', {});
        const currentAgents = (config?.agents as Record<string, unknown>)?.list as Array<Record<string, unknown>> || [];

        const defaults = (config?.agents as Record<string, unknown>)?.defaults as Record<string, unknown> | undefined;
        const workspacePath = defaults?.workspace as string || '/root/agentbox-workspace';
        const newAgentConfig = generateGatewayAgentConfig({
          id: agentId,
          name: agentData.name,
          description: agentData.description,
          tone: agentData.tone,
          industry: agentData.industry,
          skills: agentData.skills
        }, workspacePath);

        const newConfig = {
          ...config,
          agents: {
            ...(config?.agents as Record<string, unknown> || {}),
            list: [...currentAgents, newAgentConfig],
          },
        };

        await send('config.apply', newConfig);

        // Write SOUL.md to gateway workspace so the running agent reads the correct language immediately
        try {
          await send('files.write', { sessionKey, path: 'SOUL.md', content: soulContent });
        } catch {
          // Non-critical: VPS already has it
        }
      } catch (gwErr) {
        // Gateway deploy failed — agent is still saved in Supabase
        // Update status to reflect gateway issue
        console.error('Gateway deploy failed:', gwErr);
        throw new Error(`Agent saved but gateway deploy failed: ${gwErr instanceof Error ? gwErr.message : 'Unknown error'}`);
      }
    }

    const agent = newAgent as Agent;
    setAgents(prev => [agent, ...prev]);

    // Send bootstrap prompt to configure the agent with initial context
    // This is sent AFTER SOUL.md is written to both VPS and gateway
    if (isConnected) {
      try {
        const bootstrapPrompt = lang === 'FR'
          ? `[SYSTÈME] Tu es ${agentData.name}. Tu réponds TOUJOURS en français, c'est une règle absolue. Ton rôle : ${agentData.description || 'assistant IA'}. ${agentData.industry ? `Secteur : ${agentData.industry}.` : ''} ${agentData.skills.length > 0 ? `Tes compétences : ${agentData.skills.join(', ')}.` : ''} ${agentData.specialInstructions ? `Instructions : ${agentData.specialInstructions}` : ''} Lis ton fichier SOUL.md pour connaître ton identité complète. Confirme que tu es prêt en français.`
          : `[SYSTEM] You are ${agentData.name}. You ALWAYS respond in English, this is an absolute rule. Your role: ${agentData.description || 'AI assistant'}. ${agentData.industry ? `Industry: ${agentData.industry}.` : ''} ${agentData.skills.length > 0 ? `Your skills: ${agentData.skills.join(', ')}.` : ''} ${agentData.specialInstructions ? `Instructions: ${agentData.specialInstructions}` : ''} Read your SOUL.md file for your full identity. Confirm you are ready in English.`;

        await send('chat.send', {
          message: bootstrapPrompt.replace(/\s+/g, ' ').trim(),
          sessionKey,
          idempotencyKey: `bootstrap-${agentId}-${Date.now()}`,
        });
      } catch (bootstrapErr) {
        // Non-critical: agent is already created, bootstrap is best-effort
        console.warn('Bootstrap prompt failed:', bootstrapErr);
      }
    }

    return agent;
  }, [user, isConnected, send]);

  // Delete an agent from Supabase + remove from gateway
  const deleteAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    
    // Prevent deletion of the default "main" agent
    if (agent.gateway_agent_id === 'main') {
      throw new Error('Cannot delete the main agent');
    }

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

  // Update agent profile (name, description, photo, etc.)
  const updateAgent = useCallback(async (agentId: string, updates: {
    name?: string;
    description?: string;
    photo_url?: string | null;
    tone?: string;
    industry?: string;
    status?: 'active' | 'inactive';
  }): Promise<Agent> => {
    // Build the update payload (only include defined fields)
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.photo_url !== undefined) payload.photo_url = updates.photo_url;
    if (updates.tone !== undefined) payload.tone = updates.tone;
    if (updates.industry !== undefined) payload.industry = updates.industry;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error: updateErr } = await supabase
      .from('agents')
      .update(payload)
      .eq('id', agentId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    const updated = data as Agent;
    setAgents(prev => prev.map(a => a.id === agentId ? updated : a));
    return updated;
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    deleteAgent,
    updateAgentStatus,
    updateAgent,
  };
}
