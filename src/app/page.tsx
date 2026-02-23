"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Settings as SettingsIcon,
  Clock,
  Star,
  Coins,
  Users,
  X,
  Bot,
  Menu,
  Hash,
  MessageSquare,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import { useAuth } from '@/lib/AuthContext';
import { useAgents } from '@/lib/useAgents';
import { useTeams } from '@/lib/useTeams';
import { useNotifications } from '@/lib/useNotifications';
import type { Agent as SupabaseAgent } from '@/lib/supabase';
import AuthPage from '@/components/AuthPage';
import EnrichedSidebar from '@/components/EnrichedSidebar';
import HomePage from '@/components/HomePage';
import TeamsPage from '@/components/TeamsPage';
import TemplatesPage from '@/components/TemplatesPage';
import AgentWizard from '@/components/AgentWizard';
import AgentDetailReal from '@/components/AgentDetailReal';
import AgentConversation from '@/components/AgentConversation';
import SettingsPage from '@/components/SettingsPage';
import SkillsPage from '@/components/SkillsPage';
import ActivityPage from '@/components/ActivityPage';
import NotificationsPanel from '@/components/NotificationsPanel';
import Toast from '@/components/Toast';
import AgentSettingsPanel from '@/components/AgentSettingsPanel';
import AgentAvatar from '@/components/AgentAvatar';
import ScheduledActionsPage from '@/components/ScheduledActionsPage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    className={cn(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
      enabled ? "bg-blue-600" : "bg-slate-700"
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        enabled ? "translate-x-4" : "translate-x-0"
      )}
    />
  </button>
);

// --- Data ---

interface AgentData {
  id: number;
  name: string;
  role: string;
  status: string;
  channels: string[];
  active: boolean;
  lastActive: string;
  photo: string;
  schedule: string;
  favorite: boolean;
  tokensToday: number;
  costToday: number;
  tokenLimit: number;
  /** Session key for gateway chat */
  sessionKey?: string;
  /** Supabase agent ID (uuid) */
  supabaseId?: string;
}

// Demo agents shown when gateway is not connected AND no Supabase agents
const DEMO_AGENTS: AgentData[] = [
  {
    id: 1,
    name: 'Claudia',
    role: 'Assistante personnelle',
    status: 'Active',
    channels: ['iMessage', 'WhatsApp', 'Email'],
    active: true,
    lastActive: 'Active now',
    photo: '',
    schedule: 'Mon-Fri 9am-6pm',
    favorite: true,
    tokensToday: 2847,
    costToday: 0.42,
    tokenLimit: 5000,
    sessionKey: 'agent:claudia:main',
  },
  {
    id: 2,
    name: 'Support Bot',
    role: 'Service client',
    status: 'Active',
    channels: ['Discord', 'Slack'],
    active: true,
    lastActive: '5min ago',
    photo: '',
    schedule: '24/7',
    favorite: false,
    tokensToday: 1203,
    costToday: 0.18,
    tokenLimit: 5000,
    sessionKey: 'agent:support:main',
  },
];

/** Convert Supabase Agent to display AgentData */
function supabaseToAgentData(agent: SupabaseAgent, index: number, t: Record<string, string>): AgentData {
  return {
    id: index + 1000, // offset to avoid collision with demo agents
    name: agent.name,
    role: agent.description || agent.industry || 'AI Agent',
    status: agent.status === 'active' ? 'Active' : 'Inactive',
    channels: [],
    active: agent.status === 'active',
    lastActive: agent.status === 'active' ? (t.activeNow || 'Active now') : (t.neverStarted || 'Never started'),
    photo: agent.photo_url || '',
    schedule: 'Not configured',
    favorite: false,
    tokensToday: 0,
    costToday: 0,
    tokenLimit: 5000,
    sessionKey: agent.gateway_session_key || `agent:${agent.gateway_agent_id || agent.name.toLowerCase().replace(/\s+/g, '-')}:main`,
    supabaseId: agent.id,
  };
}

// --- Main ---

export default function AgentBoxDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [displayAgents, setDisplayAgents] = useState<AgentData[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [showAgentDetail, setShowAgentDetail] = useState(false);
  const [agentMenuId, setAgentMenuId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; description?: string }>({
    visible: false,
    message: '',
  });
  const [currentSessionKey, setCurrentSessionKey] = useState<string>('agent:main:main');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsPanelAgent, setSettingsPanelAgent] = useState<AgentData | null>(null);
  const { t } = useI18n();
  const { isConnected } = useGateway();
  const { agents: supabaseAgents, loading: agentsLoading, createAgent, deleteAgent, updateAgentStatus, fetchAgents } = useAgents();
  const { teams: supabaseTeams, loading: teamsLoading } = useTeams();
  const { notifications: realNotifications, unreadCount: realUnreadCount, addNotification, markAsRead, markAllAsRead } = useNotifications();

  const unreadCount = realUnreadCount;

  // Admin check for agent limit
  const ADMIN_EMAIL = 'contact@pixel-drop.com';
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Convert Supabase agents to display format, or show demo agents if none
  useEffect(() => {
    if (agentsLoading) return;

    let agentsToDisplay: AgentData[] = [];

    if (supabaseAgents.length > 0) {
      // Real agents from Supabase
      agentsToDisplay = supabaseAgents.map((a, i) => supabaseToAgentData(a, i, t.agents as unknown as Record<string, string>));
    } else if (!user) {
      // Not logged in: show demo
      agentsToDisplay = DEMO_AGENTS;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      agentsToDisplay = agentsToDisplay.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.role.toLowerCase().includes(query)
      );
    }

    setDisplayAgents(agentsToDisplay);
  }, [supabaseAgents, agentsLoading, user, t, searchQuery]);

  // Close agent menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setAgentMenuId(null);
    };
    
    if (agentMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [agentMenuId]);

  const toggleAgent = async (id: number) => {
    const agent = displayAgents.find(a => a.id === id);
    if (!agent) return;

    if (agent.supabaseId) {
      // Real agent: update in Supabase
      const newStatus = agent.active ? 'inactive' : 'active';
      try {
        await updateAgentStatus(agent.supabaseId, newStatus as 'active' | 'inactive');
      } catch {
        setToast({ visible: true, message: 'Failed to update agent status' });
      }
    } else {
      // Demo agent: toggle locally
      setDisplayAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, active: !a.active, status: !a.active ? 'Active' : 'Inactive' }
            : a
        )
      );
    }
  };

  const toggleFavorite = (id: number) => {
    setDisplayAgents((prev) =>
      prev.map((agent) =>
        agent.id === id ? { ...agent, favorite: !agent.favorite } : agent
      )
    );
  };

  const favoriteAgents = displayAgents
    .filter((a) => a.favorite)
    .map((a) => ({ id: String(a.id), name: a.name, photo: a.photo, active: a.active }));

  const selectedAgent = selectedAgentId !== null ? displayAgents.find((a) => a.id === selectedAgentId) : null;

  const handleSelectAgent = (id: string) => {
    const numId = parseInt(id);
    const agent = displayAgents.find(a => a.id === numId);
    setSelectedAgentId(numId);
    setShowAgentDetail(false);
    if (agent?.sessionKey) {
      setCurrentSessionKey(agent.sessionKey);
    } else {
      setCurrentSessionKey(`agent:${agent?.name?.toLowerCase().replace(/\s+/g, '-') || numId}:main`);
    }
    setCurrentPage('agent-conversation');
  };

  const handleNavigate = (page: string) => {
    setSelectedAgentId(null);
    setShowAgentDetail(false);
    setCurrentPage(page);
  };

  const handleAgentCreated = useCallback(
    async (supabaseAgent: SupabaseAgent) => {
      // Agent was saved to Supabase (and potentially gateway) via useAgents.createAgent
      // Refresh the agent list
      fetchAgents();

      setShowWizard(false);

      // Show toast
      setToast({
        visible: true,
        message: t.toast.agentCreated,
        description: `${supabaseAgent.name} ${t.toast.agentLaunched}`,
      });

      // Add notification
      await addNotification({
        type: 'success',
        title: 'Agent créé',
        message: `L'agent ${supabaseAgent.name} a été créé et est maintenant actif.`,
      });

      // Navigate to the agent's conversation
      const sessionKey = supabaseAgent.gateway_session_key || `agent:${supabaseAgent.gateway_agent_id || supabaseAgent.name.toLowerCase().replace(/\s+/g, '-')}:main`;
      setTimeout(() => {
        // Find the agent in the display list after refresh
        setCurrentSessionKey(sessionKey);
        setCurrentPage('agent-conversation');
        // Use a temporary ID that will match after fetchAgents completes
        const tempAgent = supabaseToAgentData(supabaseAgent, 0, t.agents as unknown as Record<string, string>);
        setDisplayAgents(prev => {
          // Ensure the agent is in the list
          if (!prev.find(a => a.supabaseId === supabaseAgent.id)) {
            return [tempAgent, ...prev];
          }
          return prev;
        });
        setSelectedAgentId(tempAgent.id);
      }, 300);
    },
    [t, fetchAgents]
  );

  // Legacy handler for demo mode
  const handleLaunchAgent = useCallback(
    (agentData: {
      name: string;
      description: string;
      tone: string;
      industry: string;
      photo: string | null;
      skills: string[];
    }) => {
      // Only used in demo mode (no Supabase)
      const sessionKey = `agent:${agentData.name.toLowerCase().replace(/\s+/g, '-') || `agent-${Date.now()}`}:main`;

      const newAgent: AgentData = {
        id: Date.now(),
        name: agentData.name,
        role: agentData.description || agentData.industry || 'AI Agent',
        status: 'Active',
        channels: [],
        active: true,
        lastActive: t.agents.activeNow,
        photo: agentData.photo || '',
        schedule: 'Not configured',
        favorite: false,
        tokensToday: 0,
        costToday: 0,
        tokenLimit: 5000,
        sessionKey,
      };

      setDisplayAgents((prev) => [newAgent, ...prev]);
      setShowWizard(false);

      setToast({
        visible: true,
        message: t.toast.agentCreated,
        description: `${agentData.name} ${t.toast.agentLaunched}`,
      });

      setTimeout(() => {
        setSelectedAgentId(newAgent.id);
        setCurrentSessionKey(sessionKey);
        setShowAgentDetail(false);
        setCurrentPage('agent-conversation');
      }, 500);
    },
    [t]
  );

  const handleDeleteAgent = async (id: number) => {
    const agent = displayAgents.find(a => a.id === id);
    if (!agent) return;

    if (agent.supabaseId) {
      try {
        await deleteAgent(agent.supabaseId);
        setToast({ visible: true, message: 'Agent deleted successfully' });
      } catch {
        setToast({ visible: true, message: 'Failed to delete agent' });
      }
    } else {
      // Demo agent: remove locally
      setDisplayAgents(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const formatTokens = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ElementType> = {
      WhatsApp: MessageCircle,
      Email: Mail,
      Telegram: MessageSquare,
      Discord: Hash,
      Slack: Hash,
      Signal: MessageSquare,
      iMessage: MessageSquare,
    };
    return icons[channel] || MessageSquare;
  };

  const channelColors: Record<string, string> = {
    WhatsApp: 'text-[#22C55E]',
    Email: 'text-[#3B82F6]',
    Telegram: 'text-[#06B6D4]',
    Discord: 'text-[#5865F2]',
    Slack: 'text-[#E01E5A]',
    Signal: 'text-[#3A76F0]',
    iMessage: 'text-[#34C759]',
  };

  const renderContent = () => {
    // Agent conversation view
    if (currentPage === 'agent-conversation' && selectedAgent) {
      return (
        <AgentConversation
          agent={selectedAgent}
          sessionKey={currentSessionKey}
          onBack={() => {
            setSelectedAgentId(null);
            setCurrentPage('agents');
          }}
          supabaseAgentId={selectedAgent.supabaseId}
        />
      );
    }

    // Agent detail (settings) view
    if (currentPage === 'agent-detail' && selectedAgent) {
      // Find the corresponding Supabase agent
      const supabaseAgent = supabaseAgents.find(a => a.id === selectedAgent.supabaseId);
      if (!supabaseAgent) {
        return (
          <div className="flex items-center justify-center h-screen bg-[#0B0F1A] text-slate-200">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Agent non trouvé</p>
              <button 
                onClick={() => setCurrentPage('agents')}
                className="text-blue-400 hover:text-blue-300"
              >
                Retour aux agents
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <AgentDetailReal
          agent={supabaseAgent}
          onBack={() => {
            setShowAgentDetail(false);
            setCurrentPage('agent-conversation');
          }}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            agents={displayAgents.map(a => ({ id: a.id, name: a.name, photo: a.photo, active: a.active, sessionKey: a.sessionKey }))} 
            onSendMessage={(message, agentId) => {
              const targetId = agentId ?? displayAgents.find(a => a.active)?.id ?? displayAgents[0]?.id;
              if (targetId) {
                const agent = displayAgents.find(a => a.id === targetId);
                if (agent) {
                  setSelectedAgentId(agent.id);
                  if (agent.sessionKey) {
                    setCurrentSessionKey(agent.sessionKey);
                  } else {
                    setCurrentSessionKey(`agent:${agent.name.toLowerCase().replace(/\s+/g, '-')}:main`);
                  }
                  setCurrentPage('agent-conversation');
                  sessionStorage.setItem('agentbox_initial_message', message);
                }
              }
            }}
          />
        );
      case 'teams':
        return <TeamsPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'settings':
        return <SettingsPage />;
      case 'skills':
        return <SkillsPage agents={displayAgents.map(a => ({ id: a.id, name: a.name, photo: a.photo }))} />;
      case 'activity':
        return <ActivityPage />;
      case 'scheduled-actions':
        return (
          <ScheduledActionsPage
            agents={displayAgents.map(a => ({ id: a.id, name: a.name, photo: a.photo, active: a.active, sessionKey: a.sessionKey }))}
            onSelectAgent={(id) => handleSelectAgent(String(id))}
          />
        );
      case 'agents':
      default:
        return renderAgentsPage();
    }
  };

  const renderAgentsPage = () => (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder={t.agents.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 border-2 border-[#0B0F1A]">
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <NotificationsPanel
                  notifications={realNotifications.map(n => ({
                    id: n.id,
                    type: n.type === 'success' ? 'task' : n.type === 'info' ? 'reminder' : n.type === 'warning' ? 'reminder' : 'error',
                    agentName: n.title,
                    agentPhoto: '',
                    message: n.message,
                    time: new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    read: n.read,
                  }))}
                  onMarkAllRead={handleMarkAllRead}
                  onMarkRead={handleMarkRead}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <Plus size={18} />
            {t.agents.newAgent}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-8 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">{t.agents.title}</h2>
          <p className="text-slate-400 text-sm">{t.agents.subtitle}</p>
        </div>

        {/* Loading state */}
        {agentsLoading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#131825] border border-slate-800/60 rounded-xl p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-700/50" />
                    <div>
                      <div className="h-4 bg-slate-700/50 rounded w-32 mb-2" />
                      <div className="h-3 bg-slate-700/50 rounded w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-slate-700/50" />
                    <div className="w-9 h-5 rounded-full bg-slate-700/50" />
                    <div className="w-5 h-5 rounded bg-slate-700/50" />
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-slate-700/50 rounded-full w-20" />
                  <div className="h-6 bg-slate-700/50 rounded-full w-16" />
                </div>
                <div className="h-3 bg-slate-700/50 rounded w-full mb-2" />
                <div className="h-2 bg-slate-700/50 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {(!agentsLoading && displayAgents.length === 0) && (
          <div className="mt-4 p-16 rounded-2xl border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Bot size={40} className="text-blue-400" />
            </div>
            <h4 className="text-2xl text-white font-bold mb-3">{t.emptyState.agentsTitle}</h4>
            <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">{t.emptyState.agentsDesc}</p>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              {t.emptyState.agentsButton}
            </button>
          </div>
        )}

        {!agentsLoading && displayAgents.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleSelectAgent(String(agent.id))}
                className="group relative bg-[#131825] border border-slate-800/60 rounded-xl p-6 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <AgentAvatar
                      name={agent.name}
                      photo={agent.photo}
                      size="md"
                      active={agent.active}
                      showStatus
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {agent.name}
                      </h3>
                      <p className="text-[13px] text-slate-400 font-medium truncate">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(agent.id); }}
                      className="p-1 transition-colors"
                      title={agent.favorite ? t.favorites.removeFromFavorites : t.favorites.addToFavorites}
                    >
                      <Star
                        size={18}
                        className={cn(
                          "transition-colors",
                          agent.favorite
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-600 hover:text-slate-400"
                        )}
                      />
                    </button>
                    <Toggle enabled={agent.active} onChange={() => { toggleAgent(agent.id); }} />
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSettingsPanelAgent(agent);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title={t.conversation.agentSettings}
                    >
                      <SettingsIcon size={18} />
                    </button>
                  </div>
                </div>

                {/* Channels row */}
                <div className="flex items-center gap-3 mb-3">
                  {agent.channels.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {agent.channels.map((channel) => {
                        const Icon = getChannelIcon(channel);
                        return (
                          <div
                            key={channel}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/80 border border-slate-700/50",
                              channelColors[channel]
                            )}
                            title={channel}
                          >
                            <Icon size={14} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSettingsPanelAgent(agent); }}
                      className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-blue-400 transition-colors"
                    >
                      <Plus size={12} />
                      <span className="font-medium">{t.agents.noChannels}</span>
                    </button>
                  )}
                </div>

                {/* Team row */}
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-slate-500 flex-shrink-0" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setSettingsPanelAgent(agent); }}
                    className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    <span>{t.agents.noTeam}</span>
                    <Plus size={12} />
                  </button>
                </div>

                {/* Schedule — only show if configured */}
                {agent.schedule && agent.schedule !== 'Not configured' && (
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-[12px] text-slate-400 truncate">{agent.schedule}</span>
                  </div>
                )}

                {/* Token cost info */}
                {agent.tokensToday > 0 && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Coins size={13} className="text-amber-400/70" />
                      <span className="text-[12px] text-slate-400">
                        {formatTokens(agent.tokensToday)} {t.agents.tokensToday} · ${agent.costToday.toFixed(2)} {t.agents.today}
                      </span>
                    </div>
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden min-w-0">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          agent.tokensToday / agent.tokenLimit > 0.8 ? "bg-amber-500" : "bg-blue-500/60"
                        )}
                        style={{ width: `${Math.min((agent.tokensToday / agent.tokenLimit) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">{t.agents.limit}: {formatTokens(agent.tokenLimit)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[12px] font-medium",
                      agent.active ? "text-green-500" : "text-slate-500"
                    )}
                  >
                    {agent.active ? t.agents.active : t.agents.inactive}
                  </span>
                  <span className="text-[12px] text-slate-500 truncate ml-2">
                    {t.agents.lastActive}:{" "}
                    <span className="text-slate-400 font-medium">{agent.lastActive}</span>
                  </span>
                </div>

                <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/0 group-hover:border-white/5 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {/* Scale hint */}
        {!agentsLoading && displayAgents.length > 0 && (
          <div className="mt-12 p-8 rounded-2xl border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-500">
              <Plus size={24} />
            </div>
            <h4 className="text-white font-semibold mb-1">{t.agents.scaleTitle}</h4>
            <p className="text-slate-500 text-sm max-w-xs">{t.agents.scaleDesc}</p>
            <button
              onClick={() => setCurrentPage('templates')}
              className="mt-4 text-blue-500 hover:text-blue-400 text-sm font-semibold transition-colors"
            >
              {t.agents.browseTemplates}
            </button>
          </div>
        )}
      </div>
    </>
  );

  // Auth guard - after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-slate-800/80 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Enriched Sidebar */}
      <EnrichedSidebar
        currentPage={
          currentPage === 'agent-detail' || currentPage === 'agent-conversation'
            ? 'agents'
            : currentPage === 'scheduled-actions'
            ? 'scheduled-actions'
            : currentPage
        }
        onNavigate={handleNavigate}
        favoriteAgents={favoriteAgents}
        onSelectAgent={handleSelectAgent}
        agents={displayAgents}
        teams={supabaseTeams}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-[240px] pt-14 md:pt-0">{renderContent()}</main>

      {showWizard && (
        <AgentWizard
          onClose={() => setShowWizard(false)}
          onLaunch={handleLaunchAgent}
          onAgentCreated={handleAgentCreated}
          createAgent={user ? createAgent : undefined}
          agentCount={supabaseAgents.length}
          isAdmin={isAdmin}
        />
      )}

      {/* Agent Settings Panel from cards */}
      {settingsPanelAgent && (
        <AgentSettingsPanel
          open={!!settingsPanelAgent}
          onClose={() => setSettingsPanelAgent(null)}
          agent={{
            id: settingsPanelAgent.id,
            name: settingsPanelAgent.name,
            role: settingsPanelAgent.role,
            photo: settingsPanelAgent.photo,
            active: settingsPanelAgent.active,
            channels: settingsPanelAgent.channels,
            schedule: settingsPanelAgent.schedule,
          }}
          sessionKey={settingsPanelAgent.sessionKey || `agent:${settingsPanelAgent.name.toLowerCase().replace(/\s+/g, '-')}:main`}
          onNavigateToScheduledActions={() => {
            setSettingsPanelAgent(null);
            handleNavigate('scheduled-actions');
          }}
          supabaseAgentId={settingsPanelAgent.supabaseId}
        />
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        description={toast.description}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
