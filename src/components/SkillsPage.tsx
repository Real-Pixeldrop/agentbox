"use client";

import React, { useState } from 'react';
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
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkillsPageProps {
  agents?: Array<{ id: number; name: string; photo: string }>;
}

interface Skill {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  enabled: boolean;
  assignedAgents: number[];
}

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

export default function SkillsPage({ agents = [] }: SkillsPageProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignModalSkillId, setAssignModalSkillId] = useState<string | null>(null);

  const [skills, setSkills] = useState<Skill[]>([
    { id: 'web-search', nameKey: 'webSearch', descKey: 'webSearchDesc', icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', enabled: true, assignedAgents: [] },
    { id: 'email', nameKey: 'email', descKey: 'emailDesc', icon: Mail, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', enabled: true, assignedAgents: [] },
    { id: 'calendar', nameKey: 'calendar', descKey: 'calendarDesc', icon: CalendarDays, color: 'text-violet-400', bgColor: 'bg-violet-500/10', enabled: false, assignedAgents: [] },
    { id: 'crm', nameKey: 'crmSkill', descKey: 'crmSkillDesc', icon: Contact, color: 'text-amber-400', bgColor: 'bg-amber-500/10', enabled: false, assignedAgents: [] },
    { id: 'whatsapp', nameKey: 'whatsapp', descKey: 'whatsappDesc', icon: MessageCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', enabled: false, assignedAgents: [] },
    { id: 'slack', nameKey: 'slack', descKey: 'slackDesc', icon: Hash, color: 'text-pink-400', bgColor: 'bg-pink-500/10', enabled: false, assignedAgents: [] },
    { id: 'github', nameKey: 'github', descKey: 'githubDesc', icon: Github, color: 'text-slate-300', bgColor: 'bg-slate-500/10', enabled: false, assignedAgents: [] },
    { id: 'weather', nameKey: 'weather', descKey: 'weatherDesc', icon: CloudSun, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', enabled: false, assignedAgents: [] },
  ]);

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const toggleAgentAssignment = (skillId: string, agentId: number) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      const has = s.assignedAgents.includes(agentId);
      return {
        ...s,
        assignedAgents: has
          ? s.assignedAgents.filter(id => id !== agentId)
          : [...s.assignedAgents, agentId],
      };
    }));
  };

  const filteredSkills = skills.filter(s => {
    const name = (t.skills as Record<string, string>)[s.nameKey] || s.nameKey;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const assignModalSkill = skills.find(s => s.id === assignModalSkillId);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
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

      <div className="p-8 max-w-5xl mx-auto">
        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSkills.map((skill, i) => {
            const Icon = skill.icon;
            const name = (t.skills as Record<string, string>)[skill.nameKey] || skill.nameKey;
            const desc = (t.skills as Record<string, string>)[skill.descKey] || skill.descKey;

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-[#131825] border border-slate-800/60 rounded-xl p-5 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-2.5 rounded-lg", skill.bgColor)}>
                    <Icon className={cn("w-5 h-5", skill.color)} />
                  </div>
                  <Toggle enabled={skill.enabled} onChange={() => toggleSkill(skill.id)} />
                </div>

                <h3 className="text-base font-bold text-white mb-1">{name}</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{desc}</p>

                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider",
                    skill.enabled ? "text-blue-400" : "text-slate-600"
                  )}>
                    {skill.enabled ? t.skills.enabled : t.skills.disabled}
                  </span>
                  <button
                    onClick={() => setAssignModalSkillId(skill.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {skill.assignedAgents.length > 0
                      ? `${skill.assignedAgents.length} ${t.skills.assigned}`
                      : t.skills.assignToAgents}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#131825] border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", assignModalSkill.bgColor)}>
                    <assignModalSkill.icon className={cn("w-4 h-4", assignModalSkill.color)} />
                  </div>
                  <h3 className="text-base font-bold text-white">{t.skills.assignTitle}</h3>
                </div>
                <button
                  onClick={() => setAssignModalSkillId(null)}
                  className="p-1 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Puzzle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{t.skills.noAgents}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {agents.map(agent => {
                    const isAssigned = assignModalSkill.assignedAgents.includes(agent.id);
                    return (
                      <button
                        key={agent.id}
                        onClick={() => toggleAgentAssignment(assignModalSkill.id, agent.id)}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3 rounded-lg border transition-all",
                          isAssigned
                            ? "bg-blue-500/10 border-blue-500/30 text-white"
                            : "bg-[#0B0F1A] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <img src={agent.photo} alt={agent.name} className="w-7 h-7 rounded-full object-cover" />
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        {isAssigned && <Check className="w-4 h-4 text-blue-400" />}
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
