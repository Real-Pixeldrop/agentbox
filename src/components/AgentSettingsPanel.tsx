"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  FileText,
  Brain,
  Zap,
  Clock,
  Radio,
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  ChevronRight,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import ChannelConfig from './ChannelConfig';
import AgentAvatar from './AgentAvatar';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  agent: {
    id: number;
    name: string;
    role: string;
    photo: string;
    active: boolean;
    channels: string[];
    schedule: string;
    gatewayAgentId?: string;
  };
  sessionKey: string;
}

interface MemoryFile {
  name: string;
  path: string;
  content?: string;
}

interface SkillItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** 'created' = user-created, 'modified' = stock modified, 'stock' = untouched */
  origin: 'created' | 'modified' | 'stock';
}

interface CronItem {
  id: string;
  label: string;
  schedule: string;
  message: string;
  lastRun: string | null;
  enabled: boolean;
}

type SettingsTab = 'general' | 'tools' | 'memory' | 'skills' | 'crons' | 'channels';

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgentSettingsPanel({ open, onClose, agent, sessionKey }: AgentSettingsPanelProps) {
  const { t } = useI18n();
  const { isConnected, send } = useGateway();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Toast
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // General tab
  const [agentName, setAgentName] = useState(agent.name);
  const [agentRole, setAgentRole] = useState(agent.role);
  const [agentSchedule, setAgentSchedule] = useState(agent.schedule);

  // TOOLS.md tab
  const [toolsContent, setToolsContent] = useState('');
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsSaving, setToolsSaving] = useState(false);

  // Memory tab
  const [memoryFiles, setMemoryFiles] = useState<MemoryFile[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [selectedMemoryFile, setSelectedMemoryFile] = useState<MemoryFile | null>(null);
  const [editingMemoryContent, setEditingMemoryContent] = useState('');
  const [memoryFileSaving, setMemoryFileSaving] = useState(false);

  // Memory note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Photo upload
  const [agentPhoto, setAgentPhoto] = useState(agent.photo);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  // Skills tab
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillScript, setNewSkillScript] = useState('');
  const [skillSaving, setSkillSaving] = useState(false);

  // Crons tab
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [cronsLoading, setCronsLoading] = useState(false);
  const [showCronForm, setShowCronForm] = useState(false);
  const [editingCron, setEditingCron] = useState<CronItem | null>(null);
  const [cronLabel, setCronLabel] = useState('');
  const [cronSchedule, setCronSchedule] = useState('');
  const [cronMessage, setCronMessage] = useState('');
  const [cronSaving, setCronSaving] = useState(false);

  // ─── Auto-clear toasts ──────────────────────────────────────────────────

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 4000); return () => clearTimeout(t); }
  }, [error]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  // ─── Reset state when panel opens ───────────────────────────────────────

  useEffect(() => {
    if (open) {
      setActiveTab('general');
      setAgentName(agent.name);
      setAgentRole(agent.role);
      setAgentSchedule(agent.schedule);
      setSelectedMemoryFile(null);
      setEditingMemoryContent('');
      setShowSkillForm(false);
      setEditingSkill(null);
      setShowCronForm(false);
      setEditingCron(null);
    }
  }, [open, agent]);

  // ─── Load data when tab changes ─────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    if (activeTab === 'tools') loadToolsContent();
    if (activeTab === 'memory') loadMemoryFiles();
    if (activeTab === 'skills') loadSkills();
    if (activeTab === 'crons') loadCrons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, open]);

  // ─── TOOLS.md ───────────────────────────────────────────────────────────

  const loadToolsContent = useCallback(async () => {
    if (!isConnected) return;
    setToolsLoading(true);
    try {
      const result = await send<{ content?: string }>('files.read', {
        sessionKey,
        path: 'TOOLS.md',
      });
      setToolsContent(result?.content ?? '');
    } catch {
      // If RPC not available, try chat.inject approach
      try {
        const result = await send<{ content?: string }>('chat.inject', {
          sessionKey,
          message: '/read TOOLS.md',
        });
        setToolsContent(result?.content ?? '');
      } catch {
        setToolsContent('');
      }
    } finally {
      setToolsLoading(false);
    }
  }, [isConnected, send, sessionKey]);

  const saveToolsContent = useCallback(async () => {
    if (!isConnected) return;
    setToolsSaving(true);
    try {
      await send('files.write', {
        sessionKey,
        path: 'TOOLS.md',
        content: toolsContent,
      });
      setSuccess(t.settingsPanel.saveSuccess);
    } catch {
      try {
        await send('chat.inject', {
          sessionKey,
          message: `/write TOOLS.md\n${toolsContent}`,
        });
        setSuccess(t.settingsPanel.saveSuccess);
      } catch {
        setError(t.settingsPanel.saveFailed);
      }
    } finally {
      setToolsSaving(false);
    }
  }, [isConnected, send, sessionKey, toolsContent, t]);

  // ─── Memory ─────────────────────────────────────────────────────────────

  const loadMemoryFiles = useCallback(async () => {
    if (!isConnected) {
      setMemoryFiles([]);
      return;
    }
    setMemoryLoading(true);
    try {
      const result = await send<{ files?: Array<{ name: string; path: string }> }>('files.list', {
        sessionKey,
        paths: ['MEMORY.md', 'memory/'],
      });
      if (result?.files && result.files.length > 0) {
        setMemoryFiles(result.files.map(f => ({ name: f.name, path: f.path })));
      } else {
        setMemoryFiles([]);
      }
    } catch {
      // Fallback: empty
      setMemoryFiles([]);
    } finally {
      setMemoryLoading(false);
    }
  }, [isConnected, send, sessionKey]);

  const loadMemoryFileContent = useCallback(async (file: MemoryFile) => {
    if (!isConnected) return;
    setSelectedMemoryFile({ ...file, content: undefined });
    setEditingMemoryContent('');
    try {
      const result = await send<{ content?: string }>('files.read', {
        sessionKey,
        path: file.path || file.name,
      });
      const content = result?.content ?? '';
      setSelectedMemoryFile({ ...file, content });
      setEditingMemoryContent(content);
    } catch {
      setError(`${t.settingsPanel.loadFailed}: ${file.name}`);
      setSelectedMemoryFile(null);
    }
  }, [isConnected, send, sessionKey, t]);

  const saveMemoryFile = useCallback(async () => {
    if (!isConnected || !selectedMemoryFile) return;
    setMemoryFileSaving(true);
    try {
      await send('files.write', {
        sessionKey,
        path: selectedMemoryFile.path || selectedMemoryFile.name,
        content: editingMemoryContent,
      });
      setSelectedMemoryFile({ ...selectedMemoryFile, content: editingMemoryContent });
      setSuccess(t.settingsPanel.saveSuccess);
    } catch {
      setError(t.settingsPanel.saveFailed);
    } finally {
      setMemoryFileSaving(false);
    }
  }, [isConnected, send, sessionKey, selectedMemoryFile, editingMemoryContent, t]);

  // ─── Skills ─────────────────────────────────────────────────────────────

  const loadSkills = useCallback(async () => {
    if (!isConnected) {
      setSkills([]);
      return;
    }
    setSkillsLoading(true);
    try {
      const result = await send<{ skills?: SkillItem[] }>('files.list', {
        sessionKey,
        paths: ['skills/'],
      });
      if (result?.skills && result.skills.length > 0) {
        setSkills(result.skills);
      } else {
        setSkills([]);
      }
    } catch {
      setSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  }, [isConnected, send, sessionKey]);

  const saveSkill = useCallback(async () => {
    if (!isConnected) return;
    setSkillSaving(true);
    try {
      const skillData = editingSkill ?? {
        id: newSkillName.toLowerCase().replace(/\s+/g, '-'),
        name: newSkillName,
        description: newSkillDesc,
        enabled: true,
        origin: 'created' as const,
      };

      await send('files.write', {
        sessionKey,
        path: `skills/${skillData.id}/SKILL.md`,
        content: `# ${skillData.name}\n\n${skillData.description}\n\n## Script\n\n${editingSkill ? '' : newSkillScript}`,
      });

      setSuccess(t.settingsPanel.saveSuccess);
      setShowSkillForm(false);
      setEditingSkill(null);
      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillScript('');
      await loadSkills();
    } catch {
      setError(t.settingsPanel.saveFailed);
    } finally {
      setSkillSaving(false);
    }
  }, [isConnected, send, sessionKey, editingSkill, newSkillName, newSkillDesc, newSkillScript, loadSkills, t]);

  // ─── Crons ──────────────────────────────────────────────────────────────

  const loadCrons = useCallback(async () => {
    if (!isConnected) {
      setCrons([]);
      return;
    }
    setCronsLoading(true);
    try {
      const result = await send<{ crons?: CronItem[] }>('cron.list', { sessionKey });
      if (result?.crons && result.crons.length > 0) {
        setCrons(result.crons);
      } else {
        setCrons([]);
      }
    } catch {
      setCrons([]);
    } finally {
      setCronsLoading(false);
    }
  }, [isConnected, send, sessionKey]);

  const saveCron = useCallback(async () => {
    if (!isConnected) return;
    setCronSaving(true);
    try {
      if (editingCron) {
        await send('cron.update', {
          sessionKey,
          id: editingCron.id,
          label: cronLabel,
          schedule: cronSchedule,
          message: cronMessage,
        });
      } else {
        await send('cron.add', {
          sessionKey,
          label: cronLabel,
          schedule: cronSchedule,
          message: cronMessage,
        });
      }
      setSuccess(t.settingsPanel.saveSuccess);
      setShowCronForm(false);
      setEditingCron(null);
      setCronLabel('');
      setCronSchedule('');
      setCronMessage('');
      await loadCrons();
    } catch {
      setError(t.settingsPanel.saveFailed);
    } finally {
      setCronSaving(false);
    }
  }, [isConnected, send, sessionKey, editingCron, cronLabel, cronSchedule, cronMessage, loadCrons, t]);

  const deleteCron = useCallback(async (id: string) => {
    if (!isConnected) return;
    try {
      await send('cron.remove', { sessionKey, id });
      setSuccess(t.settingsPanel.cronDeleted);
      await loadCrons();
    } catch {
      setError(t.settingsPanel.saveFailed);
    }
  }, [isConnected, send, sessionKey, loadCrons, t]);

  const toggleCron = useCallback(async (cron: CronItem) => {
    if (!isConnected) return;
    try {
      await send('cron.update', {
        sessionKey,
        id: cron.id,
        enabled: !cron.enabled,
      });
      await loadCrons();
    } catch {
      setError(t.settingsPanel.saveFailed);
    }
  }, [isConnected, send, sessionKey, loadCrons, t]);

  // ─── Photo upload ─────────────────────────────────────────────────────

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAgentPhoto(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  // ─── Memory note ────────────────────────────────────────────────────

  const saveMemoryNote = useCallback(async () => {
    if (!noteContent.trim()) return;
    if (!isConnected) return;
    
    setNoteSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const filePath = `memory/${today}.md`;
      const header = noteTitle.trim() ? `## ${noteTitle.trim()}\n\n` : '';
      const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const noteBlock = `\n\n---\n_${timestamp}_\n${header}${noteContent.trim()}\n`;
      
      // Try to read existing file and append
      let existing = '';
      try {
        const result = await send<{ content?: string }>('files.read', {
          sessionKey,
          path: filePath,
        });
        existing = result?.content ?? '';
      } catch {
        // File doesn't exist yet, start fresh
        existing = `# Memory — ${today}\n`;
      }
      
      await send('files.write', {
        sessionKey,
        path: filePath,
        content: existing + noteBlock,
      });
      
      setSuccess(t.settingsPanel.noteSaved);
      setNoteTitle('');
      setNoteContent('');
      setShowNoteForm(false);
      // Refresh memory files
      await loadMemoryFiles();
    } catch {
      setError(t.settingsPanel.saveFailed);
    } finally {
      setNoteSaving(false);
    }
  }, [isConnected, send, sessionKey, noteTitle, noteContent, loadMemoryFiles, t]);

  // ─── Tab definitions ───────────────────────────────────────────────────

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
    { id: 'general', label: t.settingsPanel.tabGeneral, icon: Settings },
    { id: 'tools', label: t.settingsPanel.tabTools, icon: FileText },
    { id: 'memory', label: t.settingsPanel.tabMemory, icon: Brain },
    { id: 'skills', label: t.settingsPanel.tabSkills, icon: Zap },
    { id: 'crons', label: t.settingsPanel.tabCrons, icon: Clock },
    { id: 'channels', label: t.settingsPanel.tabChannels, icon: Radio },
  ];

  // ─── Render helpers ────────────────────────────────────────────────────

  const GatewayPlaceholder = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400 max-w-xs">{message}</p>
    </div>
  );

  const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );

  // ─── Tab content renderers ─────────────────────────────────────────────

  const renderGeneral = () => (
    <div className="space-y-6">
      {/* Agent photo + name */}
      <div className="flex items-center gap-4">
        <div className="relative group/avatar">
          <AgentAvatar
            name={agentName}
            photo={agentPhoto}
            size="lg"
            active={agent.active}
            showStatus
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
            {t.settingsPanel.agentName}
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            className="mt-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            {t.settingsPanel.changePhoto}
          </button>
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
          {t.settingsPanel.agentRole}
        </label>
        <input
          type="text"
          value={agentRole}
          onChange={(e) => setAgentRole(e.target.value)}
          className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Schedule */}
      <div>
        <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">
          {t.settingsPanel.schedule}
        </label>
        <input
          type="text"
          value={agentSchedule}
          onChange={(e) => setAgentSchedule(e.target.value)}
          placeholder="24/7"
          className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-4 bg-[#0B0F1A] border border-slate-800 rounded-lg">
        <div>
          <p className="text-sm font-medium text-slate-200">{t.settingsPanel.agentStatus}</p>
          <p className="text-xs text-slate-500">{agent.active ? t.conversation.online : t.conversation.offline}</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold",
          agent.active
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-slate-800 text-slate-500 border border-slate-700"
        )}>
          {agent.active ? t.agents.active : t.agents.inactive}
        </div>
      </div>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-bold text-blue-400 tracking-wide">TOOLS.MD</span>
        </div>
        {isConnected && (
          <button
            onClick={saveToolsContent}
            disabled={toolsSaving}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              toolsSaving
                ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            {toolsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {toolsSaving ? t.settingsPanel.saving : t.settingsPanel.save}
          </button>
        )}
      </div>

      {!isConnected ? (
        <GatewayPlaceholder message={t.settingsPanel.connectGateway} />
      ) : toolsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-[#0B0F1A] border border-slate-800 rounded-xl overflow-hidden focus-within:border-blue-500/30 transition-colors">
          <div className="px-4 py-2 bg-[#131825] border-b border-slate-800/50 flex items-center gap-2">
            <FileText className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500">TOOLS.md</span>
          </div>
          <textarea
            value={toolsContent}
            onChange={(e) => setToolsContent(e.target.value)}
            className="w-full min-h-[400px] p-4 bg-transparent outline-none font-mono text-sm leading-relaxed resize-none text-slate-300"
            spellCheck={false}
            placeholder={t.settingsPanel.toolsPlaceholder}
          />
        </div>
      )}
    </div>
  );

  const renderMemory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-slate-200">{t.settingsPanel.memoryFiles}</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <button
                onClick={() => { setShowNoteForm(!showNoteForm); setNoteTitle(''); setNoteContent(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.settingsPanel.addNote}
              </button>
              <button
                onClick={loadMemoryFiles}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                {t.settingsPanel.refresh}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add note form */}
      <AnimatePresence>
        {showNoteForm && isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0B0F1A] border border-purple-500/20 rounded-xl p-4 space-y-3 mb-2">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full bg-[#131825] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder={t.settingsPanel.noteTitlePlaceholder}
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-[#131825] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[100px] resize-none"
                placeholder={t.settingsPanel.noteContentPlaceholder}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={saveMemoryNote}
                  disabled={noteSaving || !noteContent.trim()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                    noteSaving || !noteContent.trim()
                      ? "bg-purple-600/50 text-purple-200 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  )}
                >
                  {noteSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {t.settingsPanel.save}
                </button>
                <button
                  onClick={() => { setShowNoteForm(false); setNoteTitle(''); setNoteContent(''); }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  {t.settingsPanel.cancel}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isConnected ? (
        <GatewayPlaceholder message={t.settingsPanel.connectGateway} />
      ) : memoryLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      ) : memoryFiles.length === 0 ? (
        <EmptyState icon={FolderOpen} message={t.settingsPanel.noMemoryFiles} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* File list */}
          <div className="md:col-span-4 space-y-1 bg-[#0B0F1A] border border-slate-800 rounded-xl p-3 max-h-[450px] overflow-y-auto">
            {memoryFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => loadMemoryFileContent(file)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-lg group cursor-pointer transition-colors",
                  selectedMemoryFile?.path === file.path
                    ? "bg-blue-500/10 text-blue-400"
                    : "hover:bg-slate-800/50 text-slate-400"
                )}
              >
                <div className="flex items-center gap-2">
                  {file.name.match(/\d{4}-\d{2}-\d{2}/) ? (
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="text-xs font-mono truncate">{file.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>

          {/* File content */}
          <div className="md:col-span-8">
            {selectedMemoryFile ? (
              <div className="bg-[#0B0F1A] border border-slate-800 rounded-xl overflow-hidden h-[450px] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[#131825] border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-mono text-blue-400 font-bold">{selectedMemoryFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMemoryFile.content !== undefined && (
                      <button
                        onClick={saveMemoryFile}
                        disabled={memoryFileSaving}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                          memoryFileSaving
                            ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                      >
                        {memoryFileSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {memoryFileSaving ? t.settingsPanel.saving : t.settingsPanel.save}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {selectedMemoryFile.content !== undefined ? (
                    <textarea
                      value={editingMemoryContent}
                      onChange={(e) => setEditingMemoryContent(e.target.value)}
                      className="w-full h-full p-4 bg-transparent outline-none font-mono text-sm leading-relaxed resize-none text-slate-300"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#0B0F1A] border border-slate-800 rounded-xl h-[450px] flex items-center justify-center">
                <div className="text-center">
                  <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-500">{t.settingsPanel.selectFile}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">{t.settingsPanel.tabSkills}</span>
        </div>
        {isConnected && (
          <button
            onClick={() => {
              setShowSkillForm(true);
              setEditingSkill(null);
              setNewSkillName('');
              setNewSkillDesc('');
              setNewSkillScript('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.settingsPanel.createSkill}
          </button>
        )}
      </div>

      {!isConnected ? (
        <GatewayPlaceholder message={t.settingsPanel.connectGateway} />
      ) : skillsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Skill form */}
          <AnimatePresence>
            {showSkillForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#0B0F1A] border border-slate-800 rounded-xl p-5 space-y-4 mb-4">
                  <h4 className="text-sm font-semibold text-white">
                    {editingSkill ? t.settingsPanel.editSkill : t.settingsPanel.createSkill}
                  </h4>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">{t.settingsPanel.skillName}</label>
                    <input
                      type="text"
                      value={editingSkill ? editingSkill.name : newSkillName}
                      onChange={(e) => editingSkill ? setEditingSkill({ ...editingSkill, name: e.target.value }) : setNewSkillName(e.target.value)}
                      className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder={t.settingsPanel.skillNamePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">{t.settingsPanel.skillDescription}</label>
                    <input
                      type="text"
                      value={editingSkill ? editingSkill.description : newSkillDesc}
                      onChange={(e) => editingSkill ? setEditingSkill({ ...editingSkill, description: e.target.value }) : setNewSkillDesc(e.target.value)}
                      className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder={t.settingsPanel.skillDescPlaceholder}
                    />
                  </div>
                  {!editingSkill && (
                    <div>
                      <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">{t.settingsPanel.skillScript}</label>
                      <textarea
                        value={newSkillScript}
                        onChange={(e) => setNewSkillScript(e.target.value)}
                        className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono min-h-[120px] resize-none"
                        placeholder={t.settingsPanel.skillScriptPlaceholder}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveSkill}
                      disabled={skillSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all"
                    >
                      {skillSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {t.settingsPanel.save}
                    </button>
                    <button
                      onClick={() => { setShowSkillForm(false); setEditingSkill(null); }}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      {t.settingsPanel.cancel}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skills grid */}
          {skills.length === 0 ? (
            <EmptyState icon={Zap} message={t.settingsPanel.noSkills} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-[#0B0F1A] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className={cn("w-4 h-4", skill.enabled ? "text-amber-400" : "text-slate-600")} />
                      <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {skill.origin === 'created' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase">
                          {t.settingsPanel.tagCreated}
                        </span>
                      )}
                      {skill.origin === 'modified' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase">
                          {t.settingsPanel.tagModified}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{skill.description}</p>
                  <button
                    onClick={() => {
                      setEditingSkill(skill);
                      setShowSkillForm(true);
                    }}
                    className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {t.settingsPanel.edit}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCrons = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">{t.settingsPanel.tabCrons}</span>
        </div>
        {isConnected && (
          <button
            onClick={() => {
              setShowCronForm(true);
              setEditingCron(null);
              setCronLabel('');
              setCronSchedule('');
              setCronMessage('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.settingsPanel.createCron}
          </button>
        )}
      </div>

      {!isConnected ? (
        <GatewayPlaceholder message={t.settingsPanel.connectGateway} />
      ) : cronsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Cron form */}
          <AnimatePresence>
            {showCronForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#0B0F1A] border border-slate-800 rounded-xl p-5 space-y-4 mb-4">
                  <h4 className="text-sm font-semibold text-white">
                    {editingCron ? t.settingsPanel.editCron : t.settingsPanel.createCron}
                  </h4>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">{t.settingsPanel.cronLabelField}</label>
                    <input
                      type="text"
                      value={cronLabel}
                      onChange={(e) => setCronLabel(e.target.value)}
                      className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder={t.settingsPanel.cronLabelPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">{t.settingsPanel.cronScheduleField}</label>
                    <input
                      type="text"
                      value={cronSchedule}
                      onChange={(e) => setCronSchedule(e.target.value)}
                      className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                      placeholder={t.settingsPanel.cronSchedulePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 block">{t.settingsPanel.cronMessageField}</label>
                    <textarea
                      value={cronMessage}
                      onChange={(e) => setCronMessage(e.target.value)}
                      className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all min-h-[80px] resize-none"
                      placeholder={t.settingsPanel.cronMessagePlaceholder}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveCron}
                      disabled={cronSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all"
                    >
                      {cronSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {t.settingsPanel.save}
                    </button>
                    <button
                      onClick={() => { setShowCronForm(false); setEditingCron(null); }}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      {t.settingsPanel.cancel}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crons list */}
          {crons.length === 0 ? (
            <EmptyState icon={Clock} message={t.settingsPanel.noCrons} />
          ) : (
            <div className="space-y-3">
              {crons.map((cron) => (
                <div
                  key={cron.id}
                  className={cn(
                    "bg-[#0B0F1A] border rounded-xl p-4 transition-colors",
                    cron.enabled ? "border-slate-800" : "border-slate-800/50 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{cron.label}</h4>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                          cron.enabled
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        )}>
                          {cron.enabled ? t.settingsPanel.cronActive : t.settingsPanel.cronPaused}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mb-1">{cron.schedule}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{cron.message}</p>
                      {cron.lastRun && (
                        <p className="text-[10px] text-slate-600 mt-1">
                          {t.settingsPanel.lastRun}: {cron.lastRun}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => toggleCron(cron)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title={cron.enabled ? t.settingsPanel.pause : t.settingsPanel.resume}
                      >
                        {cron.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCron(cron);
                          setCronLabel(cron.label);
                          setCronSchedule(cron.schedule);
                          setCronMessage(cron.message);
                          setShowCronForm(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title={t.settingsPanel.edit}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCron(cron.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title={t.settingsPanel.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneral();
      case 'tools': return renderTools();
      case 'memory': return renderMemory();
      case 'skills': return renderSkills();
      case 'crons': return renderCrons();
      case 'channels': return <ChannelConfig agentChannels={agent.channels} />;
      default: return null;
    }
  };

  // ─── Main render ───────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0F1629] border-l border-slate-800 z-50 flex flex-col shadow-2xl overflow-x-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">{t.settingsPanel.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 pb-0 border-b border-slate-800/50 overflow-x-auto scrollbar-none">
              <div className="flex gap-0.5 min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all relative rounded-t-lg",
                      activeTab === tab.id
                        ? "text-blue-400"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="settingsTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Toast notifications */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300">{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-6 mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-xs text-green-300">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
