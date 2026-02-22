"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  MoreHorizontal,
  Clock,
  Pencil,
  Star
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import EnrichedSidebar from '@/components/EnrichedSidebar';
import HomePage from '@/components/HomePage';
import TeamsPage from '@/components/TeamsPage';
import TemplatesPage from '@/components/TemplatesPage';
import AgentWizard from '@/components/AgentWizard';
import AgentDetailPanel from '@/components/AgentDetailPanel';

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
}

const INITIAL_AGENTS: AgentData[] = [
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
  }
];

// --- Main ---

export default function AgentBoxDashboard() {
  const [currentPage, setCurrentPage] = useState('home');
  const [agents, setAgents] = useState<AgentData[]>(INITIAL_AGENTS);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const { t } = useI18n();

  const toggleAgent = (id: number) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, active: !agent.active, status: !agent.active ? 'Active' : 'Inactive' } : agent
    ));
  };

  const toggleFavorite = (id: number) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, favorite: !agent.favorite } : agent
    ));
  };

  const favoriteAgents = agents
    .filter(a => a.favorite)
    .map(a => ({ id: String(a.id), name: a.name, photo: a.photo, active: a.active }));

  const selectedAgent = selectedAgentId !== null ? agents.find(a => a.id === selectedAgentId) : null;

  const handleSelectAgent = (id: string) => {
    const numId = parseInt(id);
    setSelectedAgentId(numId);
    setCurrentPage('agent-detail');
  };

  const handleNavigate = (page: string) => {
    setSelectedAgentId(null);
    setCurrentPage(page);
  };

  const renderContent = () => {
    if (currentPage === 'agent-detail' && selectedAgent) {
      return (
        <AgentDetailPanel 
          agent={selectedAgent}
          onBack={() => { setSelectedAgentId(null); setCurrentPage('agents'); }}
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
          <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0B0F1A]" />
          </button>
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
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#131825]",
                      agent.active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-600"
                    )} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{agent.name}</h3>
                    <p className="text-[13px] text-slate-400 font-medium">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Favorite Star */}
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
                  <Toggle 
                    enabled={agent.active} 
                    onChange={() => { toggleAgent(agent.id); }} 
                  />
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

              <div className="flex items-center gap-2 mb-4 group/schedule">
                <Clock size={13} className="text-slate-500" />
                <span className="text-[12px] text-slate-400">{agent.schedule}</span>
                <button className="p-1 rounded-md text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 opacity-0 group-hover/schedule:opacity-100 transition-all">
                  <Pencil size={12} />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[12px] font-medium",
                    agent.active ? "text-green-500" : "text-slate-500"
                  )}>
                    {agent.active ? t.agents.active : t.agents.inactive}
                  </span>
                </div>
                <span className="text-[12px] text-slate-500">
                  {t.agents.lastActive}: <span className="text-slate-400 font-medium">{agent.lastActive}</span>
                </span>
              </div>

              <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/0 group-hover:border-white/5 transition-colors" />
            </div>
          ))}
        </div>

        {/* Empty state */}
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
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Enriched Sidebar */}
      <EnrichedSidebar 
        currentPage={currentPage === 'agent-detail' ? 'agents' : currentPage} 
        onNavigate={handleNavigate}
        favoriteAgents={favoriteAgents}
        onSelectAgent={handleSelectAgent}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-[240px]">
        {renderContent()}
      </main>

      {showWizard && <AgentWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
