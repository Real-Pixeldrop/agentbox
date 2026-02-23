"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Database,
  Filter,
  Search,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActivityEvent {
  id: string;
  agentName: string;
  agentPhoto: string;
  type: 'email' | 'task' | 'error' | 'reminder' | 'crm';
  title: string;
  description: string;
  time: string;
  date: string;
}

const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: 'a1',
    agentName: 'Alexandre Dubois',
    agentPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    type: 'email',
    title: 'Email sent to Simon R.',
    description: 'Follow-up on invoice #2847 — payment reminder sent.',
    time: '14:22',
    date: 'Today',
  },
  {
    id: 'a2',
    agentName: 'Marie Laurent',
    agentPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
    type: 'task',
    title: 'Ticket #412 resolved',
    description: 'Customer connection issue — provided step-by-step fix.',
    time: '14:05',
    date: 'Today',
  },
  {
    id: 'a3',
    agentName: 'Sarah Cohen',
    agentPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
    type: 'crm',
    title: 'Pipeline updated',
    description: '3 new leads qualified. Total pipeline: $42,500.',
    time: '13:30',
    date: 'Today',
  },
  {
    id: 'a4',
    agentName: 'Alexandre Dubois',
    agentPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    type: 'reminder',
    title: 'Meeting reminder sent',
    description: 'RDV tomorrow 10h with Client X — brief prepared.',
    time: '12:15',
    date: 'Today',
  },
  {
    id: 'a5',
    agentName: 'Marie Laurent',
    agentPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
    type: 'email',
    title: 'Satisfaction follow-up',
    description: 'Sent satisfaction survey to Client #398.',
    time: '11:00',
    date: 'Today',
  },
  {
    id: 'a6',
    agentName: 'Sarah Cohen',
    agentPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
    type: 'error',
    title: 'WhatsApp API rate limit',
    description: 'Rate limit reached. Queued 3 messages for retry in 5min.',
    time: '10:45',
    date: 'Today',
  },
  {
    id: 'a7',
    agentName: 'Alexandre Dubois',
    agentPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    type: 'task',
    title: 'CRM sync completed',
    description: 'Synced 47 contacts from email interactions this week.',
    time: '09:00',
    date: 'Today',
  },
  {
    id: 'a8',
    agentName: 'Marie Laurent',
    agentPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
    type: 'task',
    title: 'Weekly report generated',
    description: 'Support metrics: 94% satisfaction, 12 tickets resolved.',
    time: '18:30',
    date: 'Yesterday',
  },
  {
    id: 'a9',
    agentName: 'Sarah Cohen',
    agentPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
    type: 'email',
    title: 'Cold outreach batch sent',
    description: '25 personalized emails sent. Open rate: 34%.',
    time: '16:00',
    date: 'Yesterday',
  },
  {
    id: 'a10',
    agentName: 'Alexandre Dubois',
    agentPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    type: 'crm',
    title: 'Deal stage updated',
    description: 'LXB Estate moved from Proposal to Negotiation.',
    time: '14:00',
    date: 'Yesterday',
  },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; dotColor: string }> = {
  email: { icon: Mail, color: 'text-blue-400', dotColor: 'bg-blue-500' },
  task: { icon: CheckCircle2, color: 'text-emerald-400', dotColor: 'bg-emerald-500' },
  error: { icon: AlertTriangle, color: 'text-red-400', dotColor: 'bg-red-500' },
  reminder: { icon: Bell, color: 'text-amber-400', dotColor: 'bg-amber-500' },
  crm: { icon: Database, color: 'text-purple-400', dotColor: 'bg-purple-500' },
};

type FilterType = 'all' | 'email' | 'task' | 'error' | 'reminder' | 'crm';

export default function ActivityPage() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t.activity.filterAll },
    { key: 'email', label: t.activity.filterEmail },
    { key: 'task', label: t.activity.filterTask },
    { key: 'error', label: t.activity.filterError },
    { key: 'reminder', label: t.activity.filterReminder },
    { key: 'crm', label: t.activity.filterCRM },
  ];

  const agentNames = [...new Set(MOCK_ACTIVITY.map(a => a.agentName))];

  const filteredActivity = MOCK_ACTIVITY.filter(event => {
    if (activeFilter !== 'all' && event.type !== activeFilter) return false;
    if (agentFilter !== 'all' && event.agentName !== agentFilter) return false;
    return true;
  });

  // Group by date
  const grouped: Record<string, ActivityEvent[]> = {};
  filteredActivity.forEach(event => {
    if (!grouped[event.date]) grouped[event.date] = [];
    grouped[event.date].push(event);
  });

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.activity.title}</h1>
          <p className="text-xs text-slate-500">{t.activity.subtitle}</p>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8">
          <div className="flex items-center gap-1 p-1 bg-[#131825] border border-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  activeFilter === f.key
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-[#131825] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="all">{t.activity.allAgents}</option>
              {agentNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline */}
        {Object.keys(grouped).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{date}</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                <div className="space-y-1">
                  {events.map((event, i) => {
                    const config = TYPE_CONFIG[event.type];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 group"
                      >
                        {/* Timeline dot & line */}
                        <div className="flex flex-col items-center pt-1">
                          <div className={cn("w-3 h-3 rounded-full ring-4 ring-[#0B0F1A]", config.dotColor)} />
                          {i < events.length - 1 && (
                            <div className="w-px flex-grow bg-slate-800/60 min-h-[40px]" />
                          )}
                        </div>

                        {/* Card */}
                        <div className="flex-1 pb-4">
                          <div className="bg-[#131825] border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-all group-hover:shadow-lg group-hover:shadow-black/20">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <img
                                  src={event.agentPhoto}
                                  alt={event.agentName}
                                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                                />
                                <div>
                                  <span className="text-xs text-slate-500 font-medium">{event.agentName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={cn("p-1 rounded", `${config.color}`)}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-mono text-slate-600">{event.time}</span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                              {event.title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-slate-800/50 rounded-2xl">
            <Search className="w-12 h-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">{t.activity.noActivity}</h3>
            <p className="text-sm text-slate-500">{t.activity.noActivityDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
}
