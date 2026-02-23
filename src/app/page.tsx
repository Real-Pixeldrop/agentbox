"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  Clock,
  Pencil,
  Star,
  Coins,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import { useAuth } from '@/lib/AuthContext';
import AuthPage from '@/components/AuthPage';
import EnrichedSidebar from '@/components/EnrichedSidebar';
import HomePage from '@/components/HomePage';
import TeamsPage from '@/components/TeamsPage';
import TemplatesPage from '@/components/TemplatesPage';
import AgentWizard from '@/components/AgentWizard';
import AgentDetailPanel from '@/components/AgentDetailPanel';
import AgentConversation from '@/components/AgentConversation';
import SettingsPage from '@/components/SettingsPage';
import ActivityPage from '@/components/ActivityPage';
import NotificationsPanel, { type Notification } from '@/components/NotificationsPanel';
import Toast from '@/components/Toast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

const ChannelPill = ({ type }: { type: string }) => {
  const styles: Record<string, string> = {
    WhatsApp: "bg-[#22C55E]/10 text-[#22C55E]",
    Email: "bg-[#3B82F6]/10 text-[#3B82F6]",
    Telegram: "bg-[#06B6D4]/10 text-[#06B6D4]",
    Discord: "bg-[#5865F2]/10 text-[#5865F2]",
    Slack: "bg-[#E01E5A]/10 text-[#E01E5A]",
    Signal: "bg-[#3A76F0]/10 text-[#3A76F0]",
    iMessage: "bg-[#34C759]/10 text-[#34C759]",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide", styles[type])}>
      {type}
    </span>
  );
};

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
  /** Session key for gateway chat. Format: "agent:{agentId}:main" */
  sessionKey?: string;
}

// Mock data - only used when gateway is disconnected (demo mode)
const MOCK_AGENTS: AgentData[] = [
  {
    id: 1,
    name: "Alexandre Dubois",
    role: "Finance Assistant",
    status: "Active",
    channels: ["WhatsApp", "Email"],
    active: true,
    lastActive: "Active now",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    schedule: "Mon-Fri 9am-6pm",
    favorite: true,
    tokensToday: 1247,
    costToday: 0.03,
    tokenLimit: 5000,
  },
  {
    id: 2,
    name: "Marie Laurent",
    role: "Customer Support",
    status: "Active",
    channels: ["Email", "Telegram"],
    active: true,
    lastActive: "1h ago",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    schedule: "24/7",
    favorite: true,
    tokensToday: 3842,
    costToday: 0.09,
    tokenLimit: 10000,
  },
  {
    id: 3,
    name: "Hugo Martin",
    role: "Marketing Manager",
    status: "Inactive",
    channels: [],
    active: false,
    lastActive: "Never started",
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
    schedule: "Not configured",
    favorite: false,
    tokensToday: 0,
    costToday: 0,
    tokenLimit: 5000,
  },
  {
    id: 4,
    name: "Sarah Cohen",
    role: "Sales Prospection",
    status: "Active",
    channels: ["WhatsApp", "Email", "Discord"],
    active: true,
    lastActive: "5min ago",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    schedule: "Mon-Fri 8am-8pm",
    favorite: true,
    tokensToday: 2156,
    costToday: 0.05,
    tokenLimit: 5000,
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'task', agentName: 'Alexandre Dubois', agentPhoto: 'https://randomuser.me/api/portraits/men/32.jpg', message: 'completed CRM pipeline update — 3 new leads.', time: '2 min ago', read: false },
  { id: 'n2', type: 'email', agentName: 'Marie Laurent', agentPhoto: 'https://randomuser.me/api/portraits/women/44.jpg', message: 'processed 5 support emails. 1 requires escalation.', time: '15 min ago', read: false },
  { id: 'n3', type: 'reminder', agentName: 'Alexandre Dubois', agentPhoto: 'https://randomuser.me/api/portraits/men/32.jpg', message: 'Reminder: Meeting with Client X in 2 hours.', time: '30 min ago', read: false },
  { id: 'n4', type: 'error', agentName: 'Sarah Cohen', agentPhoto: 'https://randomuser.me/api/portraits/women/68.jpg', message: 'WhatsApp API rate limit reached. 3 messages queued.', time: '1h ago', read: true },
  { id: 'n5', type: 'task', agentName: 'Sarah Cohen', agentPhoto: 'https://randomuser.me/api/portraits/women/68.jpg', message: 'sent 25 cold outreach emails. Open rate: 34%.', time: '2h ago', read: true },
];

// --- Main ---

export default function AgentBoxDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [showAgentDetail, setShowAgentDetail] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; description?: string }>({
    visible: false,
    message: '',
  });
  const [currentSessionKey, setCurrentSessionKey] = useState<string>('agent:main:main');
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const { t } = useI18n();
  const { isConnected, send } = useGateway();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load agents from gateway or use mock data
  useEffect(() => {
    if (isConnected) {
      loadRealAgents();
    } else {
      // Demo mode: show mock agents and notifications
      setAgents(MOCK_AGENTS);
      setNotifications(MOCK_NOTIFICATIONS);
      setAgentsLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const loadRealAgents = useCallback(async () => {
    try {
      // Get agent list from gateway config
      const config = await send<Record<string, unknown>>('config.get', {});
      const agentsList = (config?.agents as Record<string, unknown>)?.list as Array<Record<string, unknown>> || [];

      // Also fetch active sessions to determine agent status
      let activeSessions: string[] = [];
      try {
        const sessionsResult = await send<{ sessions?: Array<{ key: string; active?: boolean }> }>('sessions.list', {});
        activeSessions = (sessionsResult?.sessions || [])
          .filter(s => s.active)
          .map(s => s.key);
      } catch {
        // sessions.list might not exist, that's ok
      }

      const realAgents: AgentData[] = agentsList.map((agentConfig, index) => {
        const agentName = (agentConfig.name as string) || `Agent ${index + 1}`;
        const agentId = agentConfig.id as string || agentName.toLowerCase().replace(/\s+/g, '-');
        const sessionKey = `agent:${agentId}:main`;
        const isActive = activeSessions.includes(sessionKey) || (agentConfig.enabled !== false);

        return {
          id: index + 1,
          name: agentName,
          role: (agentConfig.description as string) || (agentConfig['SOUL.md'] as string || '').split('\n').find(l => l && !l.startsWith('#'))?.trim() || 'AI Agent',
          status: isActive ? 'Active' : 'Inactive',
          channels: (agentConfig.channels as string[]) || [],
          active: isActive,
          lastActive: isActive ? t.agents.activeNow : t.agents.neverStarted,
          photo: (agentConfig.photo as string) || `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`,
          schedule: (agentConfig.schedule as string) || 'Not configured',
          favorite: false,
          tokensToday: 0,
          costToday: 0,
          tokenLimit: 5000,
          sessionKey,
        };
      });

      setAgents(realAgents);
      // Clear mock notifications when connected
      setNotifications([]);
    } catch {
      // If we can't load from gateway, start with empty list
      setAgents([]);
    }
    setAgentsLoaded(true);
  }, [send, t]);

  const toggleAgent = (id: number) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id
          ? { ...agent, active: !agent.active, status: !agent.active ? 'Active' : 'Inactive' }
          : agent
      )
    );
  };

  const toggleFavorite = (id: number) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id ? { ...agent, favorite: !agent.favorite } : agent
      )
    );
  };

  const favoriteAgents = agents
    .filter((a) => a.favorite)
    .map((a) => ({ id: String(a.id), name: a.name, photo: a.photo, active: a.active }));

  const selectedAgent = selectedAgentId !== null ? agents.find((a) => a.id === selectedAgentId) : null;

  const handleSelectAgent = (id: string) => {
    const numId = parseInt(id);
    const agent = agents.find(a => a.id === numId);
    setSelectedAgentId(numId);
    setShowAgentDetail(false);
    // Set the session key for this agent
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

  const handleLaunchAgent = useCallback(
    (agentData: {
      name: string;
      description: string;
      tone: string;
      industry: string;
      photo: string | null;
      skills: string[];
    }) => {
      const agentId = agentData.name.toLowerCase().replace(/\s+/g, '-') || `agent-${Date.now()}`;
      const sessionKey = `agent:${agentId}:main`;

      const newAgent: AgentData = {
        id: Date.now(),
        name: agentData.name,
        role: agentData.description || agentData.industry || 'AI Agent',
        status: 'Active',
        channels: [],
        active: true,
        lastActive: t.agents.activeNow,
        photo: agentData.photo || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 90)}.jpg`,
        schedule: 'Not configured',
        favorite: false,
        tokensToday: 0,
        costToday: 0,
        tokenLimit: 5000,
        sessionKey,
      };

      setAgents((prev) => [newAgent, ...prev]);
      setShowWizard(false);

      // Show toast
      setToast({
        visible: true,
        message: t.toast.agentCreated,
        description: `${agentData.name} ${t.toast.agentLaunched}`,
      });

      // Add notification
      const newNotif: Notification = {
        id: `n${Date.now()}`,
        type: 'task',
        agentName: agentData.name,
        agentPhoto: newAgent.photo,
        message: 'has been created and is now active.',
        time: 'just now',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Navigate to the agent's conversation with its session key
      setTimeout(() => {
        setSelectedAgentId(newAgent.id);
        setCurrentSessionKey(sessionKey);
        setShowAgentDetail(false);
        setCurrentPage('agent-conversation');
      }, 500);
    },
    [t]
  );

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const formatTokens = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
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
          onOpenSettings={() => {
            setShowAgentDetail(true);
            setCurrentPage('agent-detail');
          }}
        />
      );
    }

    // Agent detail (settings) view
    if (currentPage === 'agent-detail' && selectedAgent) {
      return (
        <AgentDetailPanel
          agent={selectedAgent}
          onBack={() => {
            setShowAgentDetail(false);
            setCurrentPage('agent-conversation');
          }}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'teams':
        return <TeamsPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'settings':
        return <SettingsPage />;
      case 'activity':
        return <ActivityPage />;
      case 'agents':
      default:
        return renderAgentsPage();
    }
  };

  const renderAgentsPage = () => (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder={t.agents.search}
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
                  notifications={notifications}
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
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">{t.agents.title}</h2>
          <p className="text-slate-400 text-sm">{t.agents.subtitle}</p>
        </div>

        {/* Loading state */}
        {!agentsLoaded && isConnected && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading agents from gateway...</span>
            </div>
          </div>
        )}

        {/* Empty state for connected mode with no agents */}
        {agentsLoaded && agents.length === 0 && isConnected && (
          <div className="mt-4 p-12 rounded-2xl border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-500">
              <Plus size={32} />
            </div>
            <h4 className="text-xl text-white font-semibold mb-2">{t.agents.scaleTitle}</h4>
            <p className="text-slate-500 text-sm max-w-md mb-6">{t.agents.scaleDesc}</p>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              {t.agents.newAgent}
            </button>
          </div>
        )}

        {agentsLoaded && agents.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleSelectAgent(String(agent.id))}
                className="group relative bg-[#131825] border border-slate-800/60 rounded-xl p-6 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className={cn(
                          "w-12 h-12 rounded-full border-2 transition-all duration-500 object-cover",
                          agent.active ? "border-blue-500/50 scale-105" : "border-slate-700 grayscale"
                        )}
                      />
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#131825]",
                          agent.active
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                            : "bg-slate-600"
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-[13px] text-slate-400 font-medium">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <button className="p-1 text-slate-500 hover:text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
                  {agent.channels.length > 0 ? (
                    agent.channels.map((channel) => (
                      <ChannelPill key={channel} type={channel} />
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-600 font-medium italic">{t.agents.noChannels}</span>
                  )}
                </div>

                {/* Token cost info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Coins size={13} className="text-amber-400/70" />
                    <span className="text-[12px] text-slate-400">
                      {formatTokens(agent.tokensToday)} {t.agents.tokensToday} · ${agent.costToday.toFixed(2)} {t.agents.today}
                    </span>
                  </div>
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        agent.tokensToday / agent.tokenLimit > 0.8 ? "bg-amber-500" : "bg-blue-500/60"
                      )}
                      style={{ width: `${Math.min((agent.tokensToday / agent.tokenLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600">{t.agents.limit}: {formatTokens(agent.tokenLimit)}</span>
                </div>

                <div className="flex items-center gap-2 mb-4 group/schedule">
                  <Clock size={13} className="text-slate-500" />
                  <span className="text-[12px] text-slate-400">{agent.schedule}</span>
                  <button className="p-1 rounded-md text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 opacity-0 group-hover/schedule:opacity-100 transition-all">
                    <Pencil size={12} />
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[12px] font-medium",
                        agent.active ? "text-green-500" : "text-slate-500"
                      )}
                    >
                      {agent.active ? t.agents.active : t.agents.inactive}
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-500">
                    {t.agents.lastActive}:{" "}
                    <span className="text-slate-400 font-medium">{agent.lastActive}</span>
                  </span>
                </div>

                <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/0 group-hover:border-white/5 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {/* Scale hint - show for both modes when there are already agents */}
        {agentsLoaded && agents.length > 0 && (
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
      {/* Enriched Sidebar */}
      <EnrichedSidebar
        currentPage={
          currentPage === 'agent-detail' || currentPage === 'agent-conversation'
            ? 'agents'
            : currentPage
        }
        onNavigate={handleNavigate}
        favoriteAgents={favoriteAgents}
        onSelectAgent={handleSelectAgent}
        agents={agents}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-[240px]">{renderContent()}</main>

      {showWizard && (
        <AgentWizard
          onClose={() => setShowWizard(false)}
          onLaunch={handleLaunchAgent}
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
