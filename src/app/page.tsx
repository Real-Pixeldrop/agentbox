"use client";

// REQUIRED DEPENDENCIES:
// - lucide-react (npm install lucide-react)
// - clsx (npm install clsx)
// - tailwind-merge (npm install tailwind-merge)

import React, { useState } from 'react';
import AgentWizard from '@/components/AgentWizard';
import { 
  House, 
  Users, 
  LayoutGrid, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Plus, 
  MoreHorizontal,
  Mail,
  MessageSquare,
  Send,
  Linkedin,
  Pencil,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false 
}: { 
  icon: any, 
  label: string, 
  active?: boolean 
}) => (
  <div className={cn(
    "group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 border-l-2",
    active 
      ? "bg-blue-500/10 border-blue-500 text-white" 
      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
  )}>
    <Icon size={18} className={cn("transition-colors", active ? "text-blue-500" : "group-hover:text-slate-200")} />
    <span className="text-[14px] font-medium tracking-tight">{label}</span>
  </div>
);

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

const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
  <button 
    onClick={onChange}
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

const INITIAL_AGENTS = [
  {
    id: 1,
    name: "Alexandre Dubois",
    role: "Finance Assistant",
    status: "Active",
    channels: ["WhatsApp", "Email"] as string[],
    active: true,
    lastActive: "Active now",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    schedule: "Lun-Ven 9h-18h"
  },
  {
    id: 2,
    name: "Marie Laurent",
    role: "Customer Support",
    status: "Active",
    channels: ["Email", "Telegram"] as string[],
    active: true,
    lastActive: "1h ago",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    schedule: "24/7"
  },
  {
    id: 3,
    name: "Hugo Martin",
    role: "Marketing Manager",
    status: "Inactive",
    channels: [] as string[],
    active: false,
    lastActive: "Never started",
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
    schedule: "Non configuré"
  },
  {
    id: 4,
    name: "Sarah Cohen",
    role: "Sales Prospection",
    status: "Active",
    channels: ["WhatsApp", "Email", "Discord"] as string[],
    active: true,
    lastActive: "5min ago",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    schedule: "Lun-Ven 8h-20h"
  }
];

// --- Main Page ---

export default function AgentBoxDashboard() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [showWizard, setShowWizard] = useState(false);

  const toggleAgent = (id: number) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, active: !agent.active, status: !agent.active ? 'Active' : 'Inactive' } : agent
    ));
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#0F1219] border-r border-slate-800/50 flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AgentBox</h1>
          </div>
        </div>

        <nav className="flex-1 mt-2 space-y-1">
          <SidebarItem icon={House} label="Home" />
          <SidebarItem icon={Users} label="My Agents" active />
          <SidebarItem icon={LayoutGrid} label="Templates" />
          <SidebarItem icon={BarChart3} label="Activity" />
          <SidebarItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="relative">
              <img 
                src="https://randomuser.me/api/portraits/men/11.jpg" 
                alt="User" 
                className="w-9 h-9 rounded-full border border-slate-700 group-hover:border-slate-500 transition-colors"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0F1219] rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Akli G.</span>
              <span className="text-[11px] text-blue-400 font-medium uppercase tracking-wider">Pro Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[240px]">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search agents, tasks or analytics..." 
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
              New Agent
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-6xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Active Agents</h2>
            <p className="text-slate-400 text-sm">Manage and monitor your deployed AI workers in real-time.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                className="group relative bg-[#131825] border border-slate-800/60 rounded-xl p-6 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300"
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
                    <Toggle 
                      enabled={agent.active} 
                      onChange={() => toggleAgent(agent.id)} 
                    />
                    <button className="p-1 text-slate-500 hover:text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
                  {agent.channels.length > 0 ? (
                    agent.channels.map((channel: string) => (
                      <ChannelPill key={channel} type={channel as any} />
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-600 font-medium italic">No channels configured</span>
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
                      {agent.status}
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-500">
                    Last active: <span className="text-slate-400 font-medium">{agent.lastActive}</span>
                  </span>
                </div>

                {/* Aesthetic Detail: Inner Glow on Hover */}
                <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/0 group-hover:border-white/5 transition-colors" />
              </div>
            ))}
          </div>

          {/* Empty State / Bottom Hint */}
          <div className="mt-12 p-8 rounded-2xl border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-500">
              <Plus size={24} />
            </div>
            <h4 className="text-white font-semibold mb-1">Scale your workforce</h4>
            <p className="text-slate-500 text-sm max-w-xs">Deploy specialized agents to handle finance, marketing, and support tasks automatically.</p>
            <button className="mt-4 text-blue-500 hover:text-blue-400 text-sm font-semibold transition-colors">
              Browse Template Library
            </button>
          </div>
        </div>
      </main>

      {showWizard && <AgentWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
