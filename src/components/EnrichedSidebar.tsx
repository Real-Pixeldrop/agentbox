"use client";

import React from 'react';
import { 
  House, 
  Users, 
  LayoutGrid, 
  UsersRound, 
  BarChart3, 
  Settings, 
  Star, 
  Globe,
  Plus,
  Box,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EnrichedSidebarProps {
  currentPage: string;
  onNavigate: (id: string) => void;
  favoriteAgents?: { id: string; name: string; photo: string }[];
}

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  badge?: string | number;
}

const NavItem = ({ id, label, icon: Icon, isActive, onClick, badge }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "group relative flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 outline-none",
      isActive 
        ? "bg-slate-800/50 text-white shadow-sm" 
        : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon className={cn(
        "h-4 w-4 transition-colors",
        isActive ? "text-blue-400" : "group-hover:text-slate-200"
      )} />
      <span>{label}</span>
    </div>
    
    {badge && (
      <span className={cn(
        "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
        isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
      )}>
        {badge}
      </span>
    )}

    {isActive && (
      <motion.div
        layoutId="active-pill"
        className="absolute left-0 h-4 w-1 rounded-r-full bg-blue-500"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
  </button>
);

const SectionHeader = ({ title, icon: Icon, actionIcon: ActionIcon }: { title: string; icon?: React.ElementType; actionIcon?: React.ElementType }) => (
  <div className="mb-2 mt-6 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-3 w-3" />}
      {title}
    </div>
    {ActionIcon && (
      <button className="hover:text-slate-300 transition-colors">
        <ActionIcon className="h-3 w-3" />
      </button>
    )}
  </div>
);

const AgentLink = ({ name, avatarUrl, onClick }: { name: string; avatarUrl: string; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 transition-all duration-200"
  >
    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-700 group-hover:ring-slate-500 transition-all">
      <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
    </div>
    <span className="truncate">{name}</span>
  </button>
);

const TeamLink = ({ name, color, count, onClick }: { name: string; color: string; count: number; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 transition-all duration-200"
  >
    <div className="flex items-center gap-3">
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="truncate">{name}</span>
    </div>
    <span className="text-[10px] text-slate-600 group-hover:text-slate-500">{count}</span>
  </button>
);

export default function EnrichedSidebar({ 
  currentPage = 'home', 
  onNavigate,
  favoriteAgents = [],
}: EnrichedSidebarProps) {
  const { t, language, toggleLanguage } = useI18n();
  
  const mainNavItems = [
    { id: 'home', label: t.nav.home, icon: House },
    { id: 'agents', label: t.nav.myAgents, icon: Users },
    { id: 'templates', label: t.nav.templates, icon: LayoutGrid },
    { id: 'teams', label: t.nav.teams, icon: UsersRound },
    { id: 'activity', label: t.nav.activity, icon: BarChart3 },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const defaultFavorites = [
    { id: 'fav1', name: 'Alexandre Dubois', photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 'fav2', name: 'Sarah Cohen', photo: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { id: 'fav3', name: 'Marie Laurent', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
  ];

  const favorites = favoriteAgents.length > 0 ? favoriteAgents : defaultFavorites;

  const teams = [
    { id: 'team1', name: 'Sales Team', color: 'bg-emerald-500', count: 3 },
    { id: 'team2', name: 'Support Team', color: 'bg-amber-500', count: 2 },
  ];

  const recentAgents = [
    { name: 'Hugo Martin', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', time: '2m' },
    { name: 'Sarah Cohen', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', time: '1h' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-slate-800/50 bg-[#0F1219] text-slate-200 antialiased selection:bg-blue-500/30">
      
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          <Box className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Agent<span className="text-blue-500">Box</span>
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        
        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        {/* Favorites Section */}
        <SectionHeader title={t.sidebar.favorites} icon={Star} actionIcon={Plus} />
        <div className="space-y-0.5">
          {favorites.map((agent) => (
            <AgentLink 
              key={agent.id} 
              name={agent.name} 
              avatarUrl={agent.photo} 
              onClick={() => onNavigate('agents')}
            />
          ))}
        </div>

        {/* Teams Section */}
        <SectionHeader title={t.sidebar.teams} icon={UsersRound} actionIcon={Plus} />
        <div className="space-y-0.5">
          {teams.map((team) => (
            <TeamLink 
              key={team.id} 
              name={team.name} 
              color={team.color} 
              count={team.count} 
              onClick={() => onNavigate('teams')}
            />
          ))}
        </div>

        {/* Recent Agents */}
        <SectionHeader title={t.sidebar.recent} />
        <div className="space-y-3 px-3 py-1">
          {recentAgents.map((agent, i) => (
            <div key={i} className="flex items-center justify-between group cursor-pointer" onClick={() => onNavigate('agents')}>
              <div className="flex items-center gap-3">
                <img src={agent.avatar} alt="" className="h-5 w-5 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{agent.name}</span>
              </div>
              <span className="text-[10px] text-slate-700 font-mono">{agent.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Area */}
      <div className="mt-auto border-t border-slate-800/50 p-4 space-y-4">
        
        {/* Language Toggle */}
        <div className="flex justify-start">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-[10px] font-bold text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all"
          >
            <Globe className="h-3 w-3" />
            <span>{t.sidebar.language}</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-slate-800 group-hover:ring-blue-500/50 transition-all">
                <img 
                  src="https://randomuser.me/api/portraits/men/91.jpg" 
                  alt="Akli G." 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F1219]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Akli G.</span>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[9px] font-bold text-blue-400 ring-1 ring-inset ring-blue-500/20">{t.sidebar.proPlan}</span>
              </div>
            </div>
          </div>
          <MoreVertical className="h-4 w-4 text-slate-600 group-hover:text-slate-300" />
        </div>
      </div>

      {/* Sidebar Glow */}
      <div className="pointer-events-none absolute -left-[100px] top-1/2 h-[400px] w-[100px] bg-blue-500/5 blur-[120px]" />
    </aside>
  );
}
