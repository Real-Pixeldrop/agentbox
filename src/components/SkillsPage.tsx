"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  CalendarDays,
  Contact,
  MessageCircle,
  Hash,
  Github,
  CloudSun,
  Globe,
  Puzzle,
  X,
  Check,
  Users,
  Zap,
  Briefcase,
  Share2,
  LineChart,
  FileText,
  Mic,
  FolderOpen,
  Code,
  Database,
  TrendingUp,
  Send,
  Volume2,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkillsPageProps {
  agents?: Array<{ 
    id: string; 
    name: string; 
    photo_url?: string; 
    skills: string[]; 
  }>;
}

interface Skill {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  assignedAgents: string[];
}

const SKILLS_DATA: Omit<Skill, 'assignedAgents'>[] = [
  { id: 'web-search', nameKey: 'webSearch', descKey: 'webSearchDesc', icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { id: 'email-management', nameKey: 'emailManagement', descKey: 'emailManagementDesc', icon: Mail, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  { id: 'calendar', nameKey: 'calendar', descKey: 'calendarDesc', icon: CalendarDays, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
  { id: 'crm', nameKey: 'crmSkill', descKey: 'crmSkillDesc', icon: Contact, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  { id: 'whatsapp', nameKey: 'whatsapp', descKey: 'whatsappDesc', icon: MessageCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
  { id: 'social-media', nameKey: 'socialMedia', descKey: 'socialMediaDesc', icon: Share2, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  { id: 'seo-audit', nameKey: 'seoAudit', descKey: 'seoAuditDesc', icon: TrendingUp, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  { id: 'newsletter', nameKey: 'newsletter', descKey: 'newsletterDesc', icon: Send, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
  { id: 'voice-assistant', nameKey: 'voiceAssistant', descKey: 'voiceAssistantDesc', icon: Volume2, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  { id: 'file-manager', nameKey: 'fileManager', descKey: 'fileManagerDesc', icon: FolderOpen, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { id: 'code-assistant', nameKey: 'codeAssistant', descKey: 'codeAssistantDesc', icon: Code, color: 'text-slate-300', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
  { id: 'data-analysis', nameKey: 'dataAnalysis', descKey: 'dataAnalysisDesc', icon: Database, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
];

export default function SkillsPage({ agents = [] }: SkillsPageProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignModalSkillId, setAssignModalSkillId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize skills with assignments from agents
  useEffect(() => {
    const initializeSkills = () => {
      const skillsWithAssignments: Skill[] = SKILLS_DATA.map(skillData => ({
        ...skillData,
        assignedAgents: agents
          .filter(agent => agent.skills.includes(skillData.id))
          .map(agent => agent.id)
      }));
      
      setSkills(skillsWithAssignments);
      setLoading(false);
    };

    initializeSkills();
  }, [agents]);

  const toggleAgentAssignment = async (skillId: string, agentId: string) => {
    setSaving(true);
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      const hasSkill = agent.skills.includes(skillId);
      const newSkills = hasSkill
        ? agent.skills.filter(s => s !== skillId)
        : [...agent.skills, skillId];

      // Update in Supabase
      const { error } = await supabase
        .from('agents')
        .update({ skills: newSkills })
        .eq('id', agentId);

      if (error) throw error;

      // Update local state
      setSkills(prev => prev.map(s => {
        if (s.id !== skillId) return s;
        return {
          ...s,
          assignedAgents: hasSkill
            ? s.assignedAgents.filter(id => id !== agentId)
            : [...s.assignedAgents, agentId]
        };
      }));

      // Update agents prop would need to be passed back to parent
      // For now we'll update locally but this should ideally refresh the parent data
    } catch (error) {
      console.error('Failed to update agent skills:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredSkills = skills.filter(s => {
    const name = (t.skills as Record<string, string>)[s.nameKey] || s.nameKey;
    const desc = (t.skills as Record<string, string>)[s.descKey] || s.descKey;
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
  });

  const assignModalSkill = skills.find(s => s.id === assignModalSkillId);

  const getAgentById = (id: string) => agents.find(a => a.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Chargement des compétences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.skills.title}</h1>
          <p className="text-xs text-slate-500">{t.skills.subtitle}</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder={t.agents.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSkills.map((skill, i) => {
            const Icon = skill.icon;
            const name = (t.skills as Record<string, string>)[skill.nameKey] || skill.nameKey;
            const desc = (t.skills as Record<string, string>)[skill.descKey] || skill.descKey;

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "group bg-[#131825] border rounded-xl p-6 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300",
                  skill.assignedAgents.length > 0 ? skill.borderColor : "border-slate-800/60"
                )}
              >
                {/* Skill Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", skill.bgColor)}>
                    <Icon className={cn("w-6 h-6", skill.color)} />
                  </div>
                  {skill.assignedAgents.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">{skill.assignedAgents.length}</span>
                    </div>
                  )}
                </div>

                {/* Skill Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                    {desc}
                  </p>
                </div>

                {/* Assigned Agents */}
                {skill.assignedAgents.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {skill.assignedAgents.slice(0, 3).map(agentId => {
                        const agent = getAgentById(agentId);
                        if (!agent) return null;
                        
                        return (
                          <div
                            key={agentId}
                            className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-full"
                          >
                            {agent.photo_url ? (
                              <img 
                                src={agent.photo_url} 
                                alt={agent.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                                {agent.name[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-slate-300 font-medium">
                              {agent.name}
                            </span>
                          </div>
                        );
                      })}
                      {skill.assignedAgents.length > 3 && (
                        <div className="px-2 py-1 bg-slate-800/50 rounded-full">
                          <span className="text-xs text-slate-400">
                            +{skill.assignedAgents.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assign Button */}
                <button
                  onClick={() => setAssignModalSkillId(skill.id)}
                  disabled={saving}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    skill.assignedAgents.length > 0
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      {t.skills.updating}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {skill.assignedAgents.length > 0
                        ? t.skills.manageAssignments
                        : t.skills.assignToAgents}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Aucune compétence trouvée</h3>
            <p className="text-sm text-slate-500">
              Essayez de modifier votre recherche ou parcourez toutes les compétences disponibles.
            </p>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModalSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAssignModalSkillId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#131825] border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", assignModalSkill.bgColor)}>
                    <assignModalSkill.icon className={cn("w-5 h-5", assignModalSkill.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {(t.skills as Record<string, string>)[assignModalSkill.nameKey]}
                    </h3>
                    <p className="text-xs text-slate-500">{t.skills.assignTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignModalSkillId(null)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Puzzle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">{t.skills.noAgents}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {agents.map(agent => {
                    const isAssigned = assignModalSkill.assignedAgents.includes(agent.id);
                    return (
                      <button
                        key={agent.id}
                        onClick={() => toggleAgentAssignment(assignModalSkill.id, agent.id)}
                        disabled={saving}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3 rounded-lg border transition-all",
                          isAssigned
                            ? "bg-blue-500/10 border-blue-500/30 text-white"
                            : "bg-[#0B0F1A] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200",
                          saving && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {agent.photo_url ? (
                            <img 
                              src={agent.photo_url} 
                              alt={agent.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                              {agent.name[0].toUpperCase()}
                            </div>
                          )}
                          <div className="text-left">
                            <span className="text-sm font-medium block">{agent.name}</span>
                            <span className="text-xs text-slate-500">
                              {agent.skills.length} compétence{agent.skills.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        {isAssigned && <Check className="w-5 h-5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}