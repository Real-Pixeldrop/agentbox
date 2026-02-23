"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Plus,
  Pause,
  Play,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  ChevronDown,
  CalendarClock,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import { cronToHuman, formatRelativeTime, getNextRun, formatFutureTime } from '@/lib/cron-utils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface CronItem {
  id: string;
  label: string;
  schedule: string;
  message: string;
  lastRun: string | null;
  enabled: boolean;
  /** Agent session key (e.g. "agent:main:main") */
  sessionKey?: string;
  /** Agent name for display */
  agentName?: string;
  /** Agent photo URL */
  agentPhoto?: string;
}

interface AgentInfo {
  id: number;
  name: string;
  photo: string;
  active: boolean;
  sessionKey?: string;
}

type StatusFilter = 'all' | 'active' | 'paused';

interface ScheduledActionsPageProps {
  agents: AgentInfo[];
  onSelectAgent?: (id: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScheduledActionsPage({ agents, onSelectAgent }: ScheduledActionsPageProps) {
  const { t, language } = useI18n();
  const { isConnected, send } = useGateway();
  const ts = t.scheduledActions;

  // State
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCron, setEditingCron] = useState<CronItem | null>(null);

  // Form state
  const [formAgent, setFormAgent] = useState<string>('');
  const [formLabel, setFormLabel] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // ─── Load crons ─────────────────────────────────────────────────────────

  const loadAllCrons = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);

    try {
      // Try global cron.list first (returns crons for all agents)
      const result = await send<{ crons?: CronItem[] }>('cron.list', {});
      if (result?.crons && result.crons.length > 0) {
        setCrons(result.crons);
        setLoading(false);
        return;
      }

      // Fallback: load crons per agent
      const allCrons: CronItem[] = [];
      for (const agent of agents) {
        if (!agent.sessionKey) continue;
        try {
          const agentResult = await send<{ crons?: CronItem[] }>('cron.list', {
            sessionKey: agent.sessionKey,
          });
          if (agentResult?.crons) {
            const enriched = agentResult.crons.map(c => ({
              ...c,
              sessionKey: agent.sessionKey,
              agentName: agent.name,
              agentPhoto: agent.photo,
            }));
            allCrons.push(...enriched);
          }
        } catch {
          // Skip agents that fail
        }
      }
      setCrons(allCrons);
    } catch {
      setCrons([]);
    }

    setLoading(false);
  }, [isConnected, send, agents]);

  useEffect(() => {
    loadAllCrons();
  }, [loadAllCrons]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const toggleCron = useCallback(async (cron: CronItem) => {
    try {
      await send('cron.update', {
        sessionKey: cron.sessionKey,
        id: cron.id,
        enabled: !cron.enabled,
      });
      setCrons(prev => prev.map(c =>
        c.id === cron.id ? { ...c, enabled: !c.enabled } : c
      ));
    } catch {
      // silent
    }
  }, [send]);

  const deleteCron = useCallback(async (cron: CronItem) => {
    try {
      await send('cron.delete', {
        sessionKey: cron.sessionKey,
        id: cron.id,
      });
      setCrons(prev => prev.filter(c => c.id !== cron.id));
    } catch {
      // silent
    }
  }, [send]);

  const saveCron = useCallback(async () => {
    if (!formLabel.trim() || !formSchedule.trim()) return;
    setFormSaving(true);

    try {
      const sessionKey = editingCron?.sessionKey || formAgent || agents[0]?.sessionKey || '';

      if (editingCron) {
        await send('cron.update', {
          sessionKey,
          id: editingCron.id,
          label: formLabel,
          schedule: formSchedule,
          message: formMessage,
        });
      } else {
        await send('cron.add', {
          sessionKey,
          label: formLabel,
          schedule: formSchedule,
          message: formMessage,
        });
      }

      // Refresh
      await loadAllCrons();
      resetForm();
    } catch {
      // silent
    }

    setFormSaving(false);
  }, [editingCron, formAgent, formLabel, formSchedule, formMessage, send, agents, loadAllCrons]);

  const resetForm = () => {
    setShowForm(false);
    setEditingCron(null);
    setFormAgent('');
    setFormLabel('');
    setFormSchedule('');
    setFormMessage('');
  };

  const startEdit = (cron: CronItem) => {
    setEditingCron(cron);
    setFormAgent(cron.sessionKey || '');
    setFormLabel(cron.label);
    setFormSchedule(cron.schedule);
    setFormMessage(cron.message);
    setShowForm(true);
  };

  // ─── Filtering ──────────────────────────────────────────────────────────

  const filteredCrons = crons.filter(c => {
    if (agentFilter !== 'all' && c.sessionKey !== agentFilter && c.agentName !== agentFilter) {
      return false;
    }
    if (statusFilter === 'active' && !c.enabled) return false;
    if (statusFilter === 'paused' && c.enabled) return false;
    return true;
  });

  // Unique agents from crons for filter dropdown
  const cronAgents = Array.from(
    new Map(
      crons
        .filter(c => c.agentName)
        .map(c => [c.agentName, { name: c.agentName!, sessionKey: c.sessionKey!, photo: c.agentPhoto }])
    ).values()
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">{ts.title}</h1>
          {isConnected && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
              <Wifi className="w-3 h-3" />
              {t.gateway.connected}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              {ts.createAction}
            </button>
          )}
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Disconnected state */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 flex flex-col items-center justify-center text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
              <WifiOff size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{ts.gatewayRequired}</h3>
            <p className="text-slate-400 text-sm max-w-md">{ts.gatewayRequiredDesc}</p>
          </motion.div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Agent filter */}
              <div className="relative">
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="appearance-none bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 pr-8 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
                >
                  <option value="all">{ts.allAgents}</option>
                  {cronAgents.map((a) => (
                    <option key={a.sessionKey} value={a.sessionKey}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-[#131825] border border-slate-800 rounded-lg p-0.5">
                {(['all', 'active', 'paused'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      statusFilter === s
                        ? "bg-slate-700/50 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {s === 'all' ? ts.filterAll : s === 'active' ? ts.filterActive : ts.filterPaused}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={loadAllCrons}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                title={ts.refresh}
              >
                <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>

              {/* Count */}
              <span className="text-xs text-slate-500 ml-auto">
                {filteredCrons.length} {filteredCrons.length === 1 ? ts.action : ts.actions}
              </span>
            </div>

            {/* Create/Edit Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-[#131825] border border-slate-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">
                        {editingCron ? ts.editAction : ts.createAction}
                      </h3>
                      <button
                        onClick={resetForm}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Agent selector (only for new actions) */}
                    {!editingCron && agents.length > 0 && (
                      <div>
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
                          {ts.targetAgent}
                        </label>
                        <div className="relative">
                          <select
                            value={formAgent}
                            onChange={(e) => setFormAgent(e.target.value)}
                            className="w-full appearance-none bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                          >
                            <option value="">{ts.selectAgent}</option>
                            {agents.map((a) => (
                              <option key={a.id} value={a.sessionKey}>{a.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
                        {t.settingsPanel.cronLabelField}
                      </label>
                      <input
                        type="text"
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value)}
                        className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                        placeholder={t.settingsPanel.cronLabelPlaceholder}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
                        {t.settingsPanel.cronScheduleField}
                      </label>
                      <input
                        type="text"
                        value={formSchedule}
                        onChange={(e) => setFormSchedule(e.target.value)}
                        className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                        placeholder={t.settingsPanel.cronSchedulePlaceholder}
                      />
                      {formSchedule && (
                        <p className="text-xs text-blue-400 mt-1">
                          → {cronToHuman(formSchedule, language)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
                        {t.settingsPanel.cronMessageField}
                      </label>
                      <textarea
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all min-h-[80px] resize-none"
                        placeholder={t.settingsPanel.cronMessagePlaceholder}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={saveCron}
                        disabled={formSaving || !formLabel.trim() || !formSchedule.trim() || (!editingCron && !formAgent)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all",
                          formSaving || !formLabel.trim() || !formSchedule.trim() || (!editingCron && !formAgent)
                            ? "bg-slate-700 cursor-not-allowed opacity-50"
                            : "bg-blue-600 hover:bg-blue-500"
                        )}
                      >
                        {formSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {t.settingsPanel.save}
                      </button>
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                      >
                        {t.settingsPanel.cancel}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            ) : filteredCrons.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 p-16 rounded-2xl border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                  <Clock size={32} className="text-blue-400" />
                </div>
                <h4 className="text-lg text-white font-bold mb-2">{ts.noActions}</h4>
                <p className="text-slate-500 text-sm max-w-md mb-6">{ts.noActionsDesc}</p>
                <button
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
                >
                  <Plus size={16} />
                  {ts.createAction}
                </button>
              </motion.div>
            ) : (
              /* Cron cards */
              <div className="space-y-3">
                {filteredCrons.map((cron, index) => {
                  const nextRun = getNextRun(cron.schedule);
                  return (
                    <motion.div
                      key={cron.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "group bg-[#131825] border rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20",
                        cron.enabled
                          ? "border-slate-800 hover:border-slate-700"
                          : "border-slate-800/50 opacity-70 hover:opacity-90"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-bold text-white truncate">{cron.label}</h3>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0",
                              cron.enabled
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            )}>
                              {cron.enabled ? ts.filterActive : ts.filterPaused}
                            </span>
                          </div>

                          {/* Agent tag */}
                          {cron.agentName && (
                            <button
                              onClick={() => {
                                const agent = agents.find(a => a.sessionKey === cron.sessionKey || a.name === cron.agentName);
                                if (agent && onSelectAgent) onSelectAgent(agent.id);
                              }}
                              className="flex items-center gap-2 mb-3 group/agent"
                            >
                              {cron.agentPhoto ? (
                                <img src={cron.agentPhoto} alt={cron.agentName} className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700" />
                              ) : (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[8px] font-bold ring-1 ring-slate-700">
                                  {cron.agentName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-slate-400 group-hover/agent:text-blue-400 transition-colors">
                                {cron.agentName}
                              </span>
                            </button>
                          )}

                          {/* Schedule */}
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-xs text-blue-400 font-medium">
                              {cronToHuman(cron.schedule, language)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-600">({cron.schedule})</span>
                          </div>

                          {/* Message preview */}
                          {cron.message && (
                            <p className="text-xs text-slate-500 line-clamp-1 mb-2">{cron.message}</p>
                          )}

                          {/* Times */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[11px] text-slate-600">
                              {ts.lastRun}: <span className="text-slate-400">{formatRelativeTime(cron.lastRun, language)}</span>
                            </span>
                            {nextRun && (
                              <span className="text-[11px] text-slate-600">
                                {ts.nextRun}: <span className="text-slate-400">{formatFutureTime(nextRun, language)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleCron(cron)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                            title={cron.enabled ? ts.pause : ts.resume}
                          >
                            {cron.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => startEdit(cron)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                            title={ts.edit}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCron(cron)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title={ts.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
