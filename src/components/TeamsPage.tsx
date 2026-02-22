"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder, LayoutGroup } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Rocket, 
  Target, 
  Plus, 
  GripVertical, 
  X, 
  Check,
  Zap,
  Bot
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TeamAgent = { id: string; name: string; avatar: string };

type Team = {
  id: string;
  name: string;
  icon: string;
  badgeKey: string;
  badgeColor: string;
  agents: TeamAgent[];
};

const INITIAL_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Sales Team',
    icon: 'Rocket',
    badgeKey: 'highPriority',
    badgeColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    agents: [
      { id: 'a1', name: 'Alexandre Dubois', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'a2', name: 'Sarah Cohen', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'a3', name: 'Hugo Martin', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
    ]
  },
  {
    id: 't2',
    name: 'Support Team',
    icon: 'Shield',
    badgeKey: 'stable',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    agents: [
      { id: 'a4', name: 'Marie Laurent', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { id: 'a5', name: 'Hugo Martin', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
    ]
  }
];

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Shield,
  Rocket,
  Target,
  Zap,
  Bot
};

const IconButton = ({ icon: Icon, onClick, className }: { icon: React.ElementType; onClick?: () => void; className?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "p-2 rounded-lg border border-[#1E293B] bg-[#131825] hover:bg-[#1E293B] transition-all text-slate-400 hover:text-white",
      className
    )}
  >
    <Icon size={18} />
  </button>
);

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider", className)}>
    {children}
  </span>
);

export default function TeamsPage() {
  const { t } = useI18n();
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const handleUpdateTeamName = (id: string, newName: string) => {
    setTeams(prev => prev.map(team => team.id === id ? { ...team, name: newName } : team));
  };

  const handleReorderAgents = (teamId: string, newAgents: TeamAgent[]) => {
    setTeams(prev => prev.map(team => team.id === teamId ? { ...team, agents: newAgents } : team));
  };

  const createNewTeam = () => {
    const newTeam = {
      id: `t${Date.now()}`,
      name: 'New Squad',
      icon: 'Users',
      badgeKey: 'new' as const,
      badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      agents: [] as TeamAgent[]
    };
    setTeams([newTeam, ...teams]);
    setSelectedTeamId(newTeam.id);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 p-8 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-12">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-semibold tracking-tight text-white"
            >
              {t.teams.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 mt-1"
            >
              {t.teams.subtitle}
            </motion.p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewTeam}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 border border-blue-400/20"
          >
            <Plus size={18} />
            {t.teams.createTeam}
          </motion.button>
        </header>

        <AnimatePresence mode="wait">
          {teams.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-32 border border-dashed border-[#1E293B] rounded-2xl bg-[#131825]/30"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mb-6 text-slate-500">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">{t.teams.noTeams}</h3>
              <p className="text-slate-500 mb-8 max-w-sm text-center">{t.teams.noTeamsDesc}</p>
              <button 
                onClick={createNewTeam}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2"
              >
                <Plus size={18} />
                {t.teams.buildFirst}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <LayoutGroup>
                {teams.map((team) => {
                  const Icon = ICON_MAP[team.icon] || Users;
                  return (
                    <motion.div
                      key={team.id}
                      layoutId={`card-${team.id}`}
                      onClick={() => setSelectedTeamId(team.id)}
                      whileHover={{ y: -4 }}
                      className="group relative bg-[#131825] border border-[#1E293B] p-6 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 rounded-xl bg-slate-800/50 text-blue-400 group-hover:scale-110 transition-transform">
                          <Icon size={24} />
                        </div>
                        <Badge className={team.badgeColor}>{(t.teams as Record<string, string>)[team.badgeKey]}</Badge>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                          {team.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {team.agents.length} {team.agents.length === 1 ? t.teams.activeAgent : t.teams.activeAgents}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {team.agents.slice(0, 4).map((agent, i) => (
                            <div 
                              key={agent.id}
                              className="w-8 h-8 rounded-full border-2 border-[#131825] overflow-hidden"
                              style={{ zIndex: 10 - i }}
                            >
                              <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {team.agents.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-[#131825] bg-[#1E293B] flex items-center justify-center text-[10px] font-bold text-slate-400 z-0">
                              +{team.agents.length - 4}
                            </div>
                          )}
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-blue-400 font-medium">
                          {t.teams.manage} <Rocket size={12} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Team Detail Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <TeamDetailOverlay 
            team={selectedTeam} 
            onClose={() => setSelectedTeamId(null)}
            onUpdateName={(name: string) => handleUpdateTeamName(selectedTeam.id, name)}
            onReorder={(agents: TeamAgent[]) => handleReorderAgents(selectedTeam.id, agents)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamDetailOverlay({ team, onClose, onUpdateName, onReorder }: {
  team: Team;
  onClose: () => void;
  onUpdateName: (name: string) => void;
  onReorder: (agents: TeamAgent[]) => void;
}) {
  const { t } = useI18n();
  const [editingName, setEditingName] = useState(team.name);
  const Icon = ICON_MAP[team.icon] || Users;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-[#131825] border border-[#1E293B] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
              <Icon size={20} />
            </div>
            <input 
              autoFocus
              className="bg-transparent border-none text-xl font-semibold text-white focus:outline-none focus:ring-0 w-64"
              value={editingName}
              onChange={(e) => {
                setEditingName(e.target.value);
                onUpdateName(e.target.value);
              }}
            />
          </div>
          <IconButton icon={X} onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-widest">
              {t.teams.teamMembers} ({team.agents.length})
            </h4>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-400/5 border border-blue-400/20 hover:bg-blue-400/10 transition-colors">
              <Plus size={14} />
              {t.teams.addAgents}
            </button>
          </div>

          <Reorder.Group 
            axis="y" 
            values={team.agents} 
            onReorder={onReorder}
            className="space-y-2"
          >
            {team.agents.map((agent) => (
              <Reorder.Item 
                key={agent.id} 
                value={agent}
                className="group flex items-center justify-between p-3 rounded-xl bg-[#1E293B]/40 border border-[#1E293B] hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="cursor-grab active:cursor-grabbing text-slate-600 group-hover:text-slate-400">
                    <GripVertical size={16} />
                  </div>
                  <img src={agent.avatar} className="w-8 h-8 rounded-lg object-cover" alt={agent.name} />
                  <div>
                    <div className="text-sm font-medium text-white">{agent.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                     <X size={14} />
                   </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {team.agents.length === 0 && (
            <div className="text-center py-12 border border-dashed border-[#1E293B] rounded-2xl">
              <p className="text-slate-500 text-sm">{t.teams.noAgentsInTeam}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#0B0F1A]/50 border-t border-[#1E293B] flex items-center justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
           >
             {t.teams.saveChanges}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
