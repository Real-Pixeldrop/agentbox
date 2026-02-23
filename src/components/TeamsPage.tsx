"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  Bot,
  Trash2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { supabase, type Team, type Agent } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TeamWithAgents = Team & {
  agents: Partial<Agent>[];
};

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

const TeamCreateModal = ({ 
  isOpen, 
  onClose, 
  onCreateTeam 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreateTeam: (name: string, description: string) => void; 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateTeam(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#131825] border border-slate-800/60 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Créer une équipe</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom de l'équipe
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
              placeholder="ex. Équipe Sales"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
              placeholder="Décrivez l'objectif de cette équipe..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all"
            >
              Créer l'équipe
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function TeamsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamWithAgents[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load teams data from Supabase
  useEffect(() => {
    if (!user?.id) return;
    
    const loadTeams = async () => {
      try {
        setLoading(true);

        // Load teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (teamsError) throw teamsError;

        // Load team members and agent details
        const teamsWithAgents: TeamWithAgents[] = [];
        
        for (const team of teamsData || []) {
          const { data: membersData, error: membersError } = await supabase
            .from('team_members')
            .select(`
              agent_id,
              agents (
                id,
                name,
                description,
                photo_url,
                status,
                created_at
              )
            `)
            .eq('team_id', team.id);

          if (membersError) {
            console.error('Failed to load team members:', membersError);
            continue;
          }

          const agents = (membersData || [])
            .map(member => member.agents)
            .filter(Boolean) as Partial<Agent>[];

          teamsWithAgents.push({
            ...team,
            agents,
          });
        }

        setTeams(teamsWithAgents);
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [user?.id]);

  const createTeam = (name: string, description: string) => {
    const newTeam: TeamWithAgents = {
      id: `team-${Date.now()}`,
      user_id: '', // Will be set if saved to Supabase
      name,
      description,
      created_at: new Date().toISOString(),
      agents: []
    };
    setTeams(prev => [...prev, newTeam]);
  };

  const deleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(team => team.id !== teamId));
  };

  return (
    <>
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.teams.title}</h1>
          <p className="text-slate-400 text-sm">{t.teams.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
        >
          <Plus size={18} />
          {t.teams.createTeam}
        </button>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-8 max-w-6xl">
        {teams.length === 0 ? (
          <div className="mt-4 p-12 rounded-2xl border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-500">
              <Users size={32} />
            </div>
            <h4 className="text-xl text-white font-semibold mb-2">{t.teams.noTeams}</h4>
            <p className="text-slate-500 text-sm max-w-md mb-6">{t.teams.noTeamsDesc}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              {t.teams.buildFirst}
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {teams.map((team) => {
                const IconComponent = Users; // Default icon for all teams
                
                return (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="group relative bg-[#131825] border border-slate-800/60 rounded-xl p-6 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300"
                  >
                    {/* Team Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400">
                          <IconComponent size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="text-sm text-slate-400 mt-1">{team.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold border",
                              "text-blue-400 bg-blue-400/10 border-blue-400/20"
                            )}>
                              Équipe
                            </span>
                            <span className="text-xs text-slate-500">
                              {team.agents.length === 0 
                                ? t.teams.noAgentsInTeam.slice(0, -1) // Remove the period
                                : team.agents.length === 1 
                                  ? `${team.agents.length} ${t.teams.activeAgent}`
                                  : `${team.agents.length} ${t.teams.activeAgents}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Supprimer l'équipe"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="pt-4 border-t border-slate-800/50">
                      {team.agents.length > 0 ? (
                        <div className="flex -space-x-2">
                          {team.agents.map((agent, index) => (
                            <div
                              key={agent.id}
                              className="relative z-10 h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#131825] hover:z-20 hover:scale-110 transition-all"
                              style={{ zIndex: team.agents.length - index }}
                            >
                              {agent.photo_url ? (
                                <img 
                                  src={agent.photo_url} 
                                  alt={agent.name || 'Agent'} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                  {agent.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">{t.teams.noAgentsInTeam}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <TeamCreateModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateTeam={createTeam}
          />
        )}
      </AnimatePresence>
    </>
  );
}