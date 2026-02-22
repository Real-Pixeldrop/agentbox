"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Brain, 
  Database, 
  Wrench, 
  Zap, 
  Activity, 
  Radio, 
  ChevronRight, 
  Save, 
  Plus, 
  Search,
  MessageSquare,
  Mail,
  Send,
  Hash,
  Smartphone,
  CheckCircle2,
  Clock,
  FileText,
  CalendarDays,
  Target,
  BarChart3,
  Share2,
  FolderOpen,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface AgentDetailProps {
  agent: {
    id: number;
    name: string;
    role: string;
    photo: string;
    active: boolean;
    channels: string[];
    schedule: string;
  };
  onBack: () => void;
}

// --- Mock Data (OpenClaw structure) ---

const MOCK_SOUL_CONTENT = (name: string, role: string) => `# SOUL.MD — ${name}

## Identity
You are ${name}, a ${role} agent powered by OpenClaw.
You work autonomously to help your human with their daily tasks.

## Personality
- Professional but approachable
- Proactive — anticipate needs before being asked
- Concise in responses unless detail is requested

## Communication Style
- Use clear, structured messages
- Bullet points for lists and action items
- Always provide context for recommendations

## Constraints
- Never share confidential data outside authorized channels
- Escalate complex decisions to the human
- Respect quiet hours and schedule boundaries

## Goals
- Reduce response time on urgent items
- Maintain organized pipeline and follow-ups
- Build trust through consistency and reliability`;

const MOCK_MEMORY_CONTENT = `# MEMORY.MD — Long-term Memory

## User Context
- Primary human: Akli Goudjil
- Company: Pixel Drop (Digital Agency)
- Location: Paris, France

## Key Learnings
- Prefers direct communication, no fluff
- Important clients: Black Trombone, LXB Estate, Plaza Tango
- Uses Pennylane for accounting, Brevo for newsletters
- Meeting prep should include attendee research

## Behavioral Notes
- Busy mornings — batch non-urgent items for afternoon
- Responds well to structured summaries
- Values proactive updates on pipeline changes`;

const MOCK_TOOLS_CONTENT = `# TOOLS.MD — Configured Tools

## Email Management
- Provider: IMAP/SMTP via Himalaya
- Account: contact@pixel-drop.com
- Signature: HTML format with Pixel Drop branding

## Calendar
- Provider: Apple Calendar via AppleScript
- Sync: Real-time event monitoring

## Web Search
- Provider: Perplexity Sonar API
- Usage: Research, event verification, lead enrichment

## File System
- Workspace: ~/clawd/
- Access: Read/Write within workspace boundaries

## CRM / Data
- Source: data.json (operational truth)
- Backup: Pennylane API (financial truth)`;

const DAILY_MEMORIES = [
  { file: 'memory/2026-02-22.md', date: '2026-02-22' },
  { file: 'memory/2026-02-21.md', date: '2026-02-21' },
  { file: 'memory/2026-02-20.md', date: '2026-02-20' },
  { file: 'memory/2026-02-19.md', date: '2026-02-19' },
  { file: 'memory/2026-02-18.md', date: '2026-02-18' },
];

const SKILLS_DATA = [
  { id: 'email', name: 'Email Management', desc: 'Read, classify and respond to emails', icon: Mail, active: true },
  { id: 'calendar', name: 'Calendar', desc: 'Schedule meetings, manage availability', icon: CalendarDays, active: true },
  { id: 'prospection', name: 'Prospection', desc: 'Find and qualify leads', icon: Target, active: false },
  { id: 'crm', name: 'CRM', desc: 'Manage contacts and pipeline', icon: Database, active: true },
  { id: 'reminders', name: 'Reminders', desc: 'Set and track reminders', icon: Bell, active: true },
  { id: 'analytics', name: 'Analytics', desc: 'Monitor KPIs and generate reports', icon: BarChart3, active: false },
  { id: 'social', name: 'Social Media', desc: 'Manage posts and engagement', icon: Share2, active: false },
  { id: 'files', name: 'File Management', desc: 'Organize and search documents', icon: FolderOpen, active: true },
];

const CHANNELS_DATA = [
  { name: 'WhatsApp', icon: MessageSquare, color: '#25D366', enabled: true },
  { name: 'Email', icon: Mail, color: '#EA4335', enabled: true },
  { name: 'Telegram', icon: Send, color: '#0088CC', enabled: false },
  { name: 'Discord', icon: Hash, color: '#5865F2', enabled: true },
  { name: 'Slack', icon: MessageSquare, color: '#4A154B', enabled: false },
  { name: 'Signal', icon: Smartphone, color: '#3A76F0', enabled: false },
  { name: 'iMessage', icon: Smartphone, color: '#34C759', enabled: false, premium: true },
];

const LOGS_DATA = [
  { time: '14:22', type: 'heartbeat', message: 'Heartbeat check completed. Inbox: 3 unread, Calendar: 1 event in 2h.', status: 'success' as const },
  { time: '14:05', type: 'email', message: 'Auto-replied to Simon R. — Invoice follow-up acknowledged.', status: 'success' as const },
  { time: '13:30', type: 'memory', message: 'Daily memory file created: memory/2026-02-22.md', status: 'info' as const },
  { time: '12:15', type: 'channel', message: 'Inbound WhatsApp from +33 6 12 34 56 78 — processed.', status: 'info' as const },
  { time: '11:00', type: 'skill', message: 'CRM pipeline updated — 2 new leads qualified.', status: 'success' as const },
  { time: '09:00', type: 'system', message: 'Agent started. SOUL.md loaded. Schedule: Mon-Fri 9am-6pm.', status: 'info' as const },
];

// --- Sub-components ---

const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={cn(
      "relative w-10 h-5 rounded-full transition-all duration-300 ease-in-out border",
      active ? "bg-blue-600/20 border-blue-500" : "bg-slate-800 border-slate-700"
    )}
  >
    <div className={cn(
      "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-300",
      active ? "translate-x-5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "translate-x-0 bg-slate-500"
    )} />
  </button>
);

const CodeBlock = ({ title, content, icon: Icon }: { title: string; content: string; icon?: React.ElementType }) => (
  <div className="flex flex-col h-full bg-[#0D1117] rounded-xl border border-[#1E293B] overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#161B22] border-b border-[#1E293B]">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-400" />}
        <span className="text-xs font-mono text-blue-400 font-bold tracking-wide">{title}</span>
      </div>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
      </div>
    </div>
    <div className="p-5 font-mono text-sm leading-relaxed text-slate-300 overflow-auto scrollbar-thin flex-1">
      <pre className="whitespace-pre-wrap">
        {content.split('\n').map((line, i) => (
          <div key={i} className="flex">
            <span className="pr-4 text-slate-600 select-none text-right w-8 shrink-0">{i + 1}</span>
            <span className={cn(
              line.startsWith('#') ? "text-blue-400 font-bold" :
              line.startsWith('-') ? "text-slate-300" :
              line.startsWith('##') ? "text-cyan-400" :
              "text-slate-400"
            )}>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  </div>
);

// --- Main Component ---

export default function AgentDetailPanel({ agent, onBack }: AgentDetailProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('personality');
  const [isActive, setIsActive] = useState(agent.active);
  const [soulContent, setSoulContent] = useState(MOCK_SOUL_CONTENT(agent.name, agent.role));
  const [skills, setSkills] = useState(SKILLS_DATA);
  const [channels, setChannels] = useState(CHANNELS_DATA);

  const tabs = [
    { id: 'personality', label: t.agentDetail.personality, icon: Brain },
    { id: 'memory', label: t.agentDetail.memory, icon: Database },
    { id: 'tools', label: t.agentDetail.tools, icon: Wrench },
    { id: 'skills', label: t.agentDetail.skills, icon: Zap },
    { id: 'activity', label: t.agentDetail.activity, icon: Activity },
    { id: 'channels', label: t.agentDetail.channels, icon: Radio },
  ];

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const toggleChannel = (name: string) => {
    setChannels(prev => prev.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c));
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Top Nav */}
      <nav className="border-b border-[#1E293B] px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0B0F1A]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <h1 className="text-sm font-medium tracking-tight text-slate-400">
            {t.nav.myAgents} / <span className="text-white">{agent.name}</span>
          </h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95">
          <Save className="w-4 h-4" />
          {t.agentDetail.deployChanges}
        </button>
      </nav>

      <main className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <header className="flex items-center gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-700">
              <img src={agent.photo} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            {isActive && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-3 border-[#0B0F1A] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-white tracking-tight">{agent.name}</h2>
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded",
                isActive 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-slate-800 text-slate-500 border-slate-700"
              )}>
                {isActive ? t.agents.active : t.agents.inactive}
              </span>
            </div>
            <p className="text-slate-400 text-base mb-3">{agent.role}</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{t.agentDetail.status}</span>
                <div className="flex items-center gap-2 px-2 py-1 bg-[#131825] border border-slate-700 rounded-lg">
                  <Toggle active={isActive} onToggle={() => setIsActive(!isActive)} />
                  <span className={cn("text-xs font-bold", isActive ? "text-blue-400" : "text-slate-500")}>
                    {isActive ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-400">{agent.schedule}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group",
                  activeTab === tab.id 
                    ? "text-blue-400 bg-blue-500/5" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="detailActiveTab"
                    className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full"
                  />
                )}
                <tab.icon className={cn("w-4.5 h-4.5", activeTab === tab.id ? "text-blue-400" : "text-slate-500")} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}

            {/* OpenClaw hint */}
            <div className="mt-6 p-3 rounded-xl bg-[#131825] border border-[#1E293B]">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t.agentDetail.openclawHint}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* PERSONALITY TAB */}
                {activeTab === 'personality' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-bold text-blue-400 tracking-wide">SOUL.MD</span>
                      <span className="text-[10px] text-slate-600 italic ml-2">{t.agentDetail.soulHint}</span>
                    </div>
                    
                    {/* Tone selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mr-2">{t.wizard.tone}:</span>
                      {[t.wizard.formal, t.wizard.friendly, t.wizard.direct].map((tone, i) => (
                        <button 
                          key={tone}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                            i === 1 
                              ? "border-blue-500/50 bg-blue-500/10 text-blue-400" 
                              : "border-[#1E293B] bg-[#131825] text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>

                    {/* SOUL.md Editor */}
                    <div className="flex flex-col bg-[#131825] rounded-2xl border border-[#1E293B] overflow-hidden focus-within:border-blue-500/30 transition-colors min-h-[450px]">
                       <div className="px-4 py-2.5 bg-[#1A2234] border-b border-[#1E293B] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-mono font-bold text-blue-400">SOUL.MD</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600">{t.agentDetail.modified}: 2m ago</span>
                       </div>
                       <textarea
                        value={soulContent}
                        onChange={(e) => setSoulContent(e.target.value)}
                        className="flex-1 p-5 bg-transparent outline-none font-mono text-sm leading-relaxed resize-none text-slate-300 min-h-[400px]"
                        spellCheck={false}
                       />
                    </div>
                  </div>
                )}

                {/* MEMORY TAB */}
                {activeTab === 'memory' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 h-[550px]">
                      <CodeBlock title="MEMORY.MD" content={MOCK_MEMORY_CONTENT} icon={Database} />
                    </div>
                    <div className="md:col-span-4 space-y-4">
                      <div className="bg-[#131825] border border-[#1E293B] rounded-xl p-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{t.agentDetail.memoryFiles}</h3>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input 
                            placeholder={t.agentDetail.searchMemory}
                            className="w-full bg-[#0B0F1A] border border-[#1E293B] rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                          />
                        </div>
                        <div className="space-y-1">
                          {DAILY_MEMORIES.map((mem) => (
                            <div key={mem.file} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 group cursor-pointer transition-colors">
                              <div className="flex items-center gap-2.5">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                                <span className="text-xs font-mono text-slate-400 group-hover:text-blue-400 transition-colors">{mem.date}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] text-blue-400/70 leading-relaxed">
                          {t.agentDetail.memoryHint}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TOOLS TAB */}
                {activeTab === 'tools' && (
                  <div className="h-[550px]">
                    <CodeBlock title="TOOLS.MD" content={MOCK_TOOLS_CONTENT} icon={Wrench} />
                  </div>
                )}

                {/* SKILLS TAB */}
                {activeTab === 'skills' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {skills.map((skill) => (
                      <div 
                        key={skill.id}
                        className={cn(
                          "p-5 rounded-2xl border transition-all duration-300 group",
                          skill.active 
                            ? "bg-[#131825] border-blue-500/20 hover:border-blue-500/40" 
                            : "bg-[#0B0F1A] border-[#1E293B] opacity-60 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            skill.active ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-500"
                          )}>
                            <skill.icon className="w-5 h-5" />
                          </div>
                          <Toggle active={skill.active} onToggle={() => toggleSkill(skill.id)} />
                        </div>
                        <h4 className={cn("font-semibold text-sm mb-1", skill.active ? "text-white" : "text-slate-400")}>{skill.name}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{skill.desc}</p>
                      </div>
                    ))}
                    <div className="border-2 border-dashed border-[#1E293B] rounded-2xl flex flex-col items-center justify-center p-5 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all cursor-pointer group">
                      <div className="p-2 bg-slate-800/50 rounded-full mb-2 group-hover:bg-blue-500/10">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{t.agentDetail.installSkill}</span>
                    </div>
                  </div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === 'activity' && (
                  <div className="bg-[#131825] border border-[#1E293B] rounded-2xl overflow-hidden">
                    <div className="px-6 py-3.5 bg-[#1A2234] border-b border-[#1E293B] flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t.agentDetail.logStream}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-green-400">{t.agentDetail.live}</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-1">
                      {LOGS_DATA.map((log, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2.5 ring-4 ring-[#131825]",
                              log.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                            )} />
                            {i < LOGS_DATA.length - 1 && <div className="w-px flex-grow bg-slate-800 min-h-[30px]" />}
                          </div>
                          <div className="flex-grow pb-5">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                              <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase">{log.type}</span>
                            </div>
                            <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CHANNELS TAB */}
                {activeTab === 'channels' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {channels.map((channel) => (
                      <div 
                        key={channel.name}
                        className={cn(
                          "relative p-6 rounded-2xl border transition-all overflow-hidden group",
                          channel.enabled 
                            ? "bg-[#131825] border-blue-500/20" 
                            : "bg-[#0B0F1A] border-[#1E293B] opacity-60 hover:opacity-100"
                        )}
                      >
                        {channel.enabled && (
                          <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: channel.color }} />
                        )}
                        <div className="flex items-center justify-between mb-5">
                          <div 
                            className="p-3 rounded-xl transition-colors"
                            style={{ 
                              backgroundColor: channel.enabled ? `${channel.color}15` : '#1E293B', 
                              color: channel.enabled ? channel.color : '#64748b' 
                            }}
                          >
                            <channel.icon className="w-5 h-5" />
                          </div>
                          <Toggle active={channel.enabled} onToggle={() => toggleChannel(channel.name)} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            {channel.name}
                            {channel.enabled && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                            {'premium' in channel && channel.premium && (
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Premium</span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {channel.enabled ? t.agentDetail.channelActive : t.agentDetail.channelInactive}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
