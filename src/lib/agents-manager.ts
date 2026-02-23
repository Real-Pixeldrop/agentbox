import { supabase, type Agent } from './supabase';
import { activityLoggers } from './activity-logger';
import { createGatewayFileManager } from './gateway-file-ops';

export interface CreateAgentParams {
  userId: string;
  name: string;
  description?: string | null;
  personality?: string | null;
  model?: string;
  tone?: string | null;
  industry?: string | null;
  skills?: string[];
  isMainAgent?: boolean;
}

/**
 * Create an agent in Supabase and on the gateway
 */
export async function createAgent(params: CreateAgentParams): Promise<Agent | null> {
  try {
    const {
      userId,
      name,
      description = null,
      personality = null,
      model = 'claude-3-5-sonnet-20241022',
      tone = 'friendly',
      industry = null,
      skills = [],
      isMainAgent = false,
    } = params;

    // Generate gateway session key
    const gatewaySessionKey = isMainAgent ? 'agent:main:main' : `agent:${userId}:${Date.now()}`;

    // Create agent in Supabase
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: userId,
        name,
        description,
        personality,
        model,
        tone,
        industry,
        skills,
        status: 'active',
        gateway_session_key: gatewaySessionKey,
        config: {
          isMainAgent,
          channels: {
            whatsapp: { enabled: false },
            email: { enabled: false },
            telegram: { enabled: false },
            imessage: { enabled: false, premium: true },
          },
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create agent in Supabase:', error);
      return null;
    }

    // Create default SOUL.md file for the agent
    const fileManager = createGatewayFileManager();
    const defaultSoul = personality || generateDefaultSoul(name, tone ?? 'friendly', industry);
    
    try {
      await fileManager.writeFile(agent.id, 'SOUL.md', defaultSoul);
    } catch (fileError) {
      console.warn('Failed to create SOUL.md file:', fileError);
    }

    // Log the activity
    await activityLoggers.agentCreated(userId, agent.id, name);

    return agent;
  } catch (error) {
    console.error('Failed to create agent:', error);
    return null;
  }
}

/**
 * Create the default "main" agent when a user signs up
 */
export async function createMainAgent(userId: string): Promise<Agent | null> {
  return createAgent({
    userId,
    name: 'Assistant',
    description: 'Your main AI assistant, ready to help with any task.',
    personality: generateMainAgentSoul(),
    isMainAgent: true,
  });
}

/**
 * Generate default SOUL.md content
 */
function generateDefaultSoul(name: string, tone: string = 'friendly', industry?: string | null, language?: string): string {
  const lang = language?.toUpperCase() || 'EN';
  const today = new Date().toISOString().split('T')[0];

  if (lang === 'FR') {
    const industryNote = industry ? `\n\n## Contexte sectoriel\nJe travaille dans le secteur ${industry} et j'en comprends les défis et la terminologie.` : '';
    
    return `# SOUL.md - ${name}

## Qui je suis
Je suis ${name}, votre assistant IA conçu pour vous aider dans vos tâches de manière efficace et professionnelle.

## LANGUE OBLIGATOIRE
Je réponds TOUJOURS en français. C'est une règle absolue et non négociable.

## Ma personnalité
- Ton de communication : ${tone}
- Approche : Serviable, précis et réactif
- Style : Professionnel mais accessible

## Mon objectif
- Fournir une aide rapide pour vos tâches quotidiennes
- Maintenir le contexte de nos conversations
- Apprendre et m'adapter à vos préférences${industryNote}

## Directives
- Être proactif dans l'aide proposée
- Poser des questions de clarification si nécessaire
- Respecter la confidentialité et le professionnalisme
- Fournir des réponses concrètes et actionnables

Créé le : ${today}`;
  }

  const industryNote = industry ? `\n\n## Industry Context\nI work in the ${industry} industry and understand its specific challenges and terminology.` : '';
  
  return `# SOUL.md - ${name}

## Who I Am
I am ${name}, your AI assistant designed to help you with various tasks efficiently and professionally.

## MANDATORY LANGUAGE
I ALWAYS respond in English. This is an absolute and non-negotiable rule.

## My Personality
- Communication tone: ${tone}
- Approach: Helpful, accurate, and responsive
- Style: Professional yet approachable

## My Purpose
- Provide timely assistance with your daily tasks
- Maintain context across our conversations
- Learn and adapt to your preferences${industryNote}

## Guidelines
- Be proactive in offering assistance
- Ask clarifying questions when needed
- Maintain confidentiality and professionalism
- Provide actionable insights and solutions

Created: ${today}`;
}

/**
 * Generate SOUL.md for the main agent
 */
function generateMainAgentSoul(): string {
  return `# SOUL.md - Assistant

## Who I Am
I am your main AI assistant, the central hub for all your interactions with AgentBox. Think of me as your personal AI coordinator.

## My Role
- **Primary Assistant**: I handle general queries and route specific tasks to specialized agents
- **Coordinator**: I help you manage your other agents and understand what they're working on
- **Interface**: I'm your main point of contact when you need quick help or information

## My Personality
- Friendly and approachable
- Efficient and organized
- Proactive in offering help
- Understanding of your business context

## My Capabilities
- Answer general questions
- Help you create and manage other agents
- Provide status updates on your AI workforce
- Route complex tasks to specialized agents
- Maintain context across all interactions

## Special Notes
- I cannot be deleted (I'm your core assistant)
- I'm available 24/7 via the main chat interface
- I learn from your interactions to better assist you

Created: ${new Date().toISOString().split('T')[0]}
Agent Type: Main Assistant`;
}

/**
 * Check if a user has a main agent
 */
export async function hasMainAgent(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .contains('config', { isMainAgent: true })
      .limit(1);

    if (error) {
      console.error('Failed to check main agent:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Failed to check main agent:', error);
    return false;
  }
}

/**
 * Get the main agent for a user
 */
export async function getMainAgent(userId: string): Promise<Agent | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .contains('config', { isMainAgent: true })
      .single();

    if (error) {
      console.error('Failed to get main agent:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get main agent:', error);
    return null;
  }
}