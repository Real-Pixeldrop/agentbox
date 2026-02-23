"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  CreditCard,
  Key,
  Globe,
  Bell,
  Camera,
  Check,
  Eye,
  EyeOff,
  Save,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  OctagonX,
  Upload,
  LogOut,
  Mail,
  Github,
  FolderOpen,
  File,
  Folder,
  Download,
  Trash2,
  RefreshCw,
  ChevronRight,
  HardDrive,
  Shield,
  ArrowLeft,
  Code,
  Terminal,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getWorkspaceInfo,
  listFiles,
  getCredentials,
  setCredential,
  deleteCredential,
  generateDownloadUrl,
  formatFileSize,
  type WorkspaceInfo,
  type FileEntry,
  type CredentialInfo,
} from '@/lib/agentbox-api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Shared components
// ============================================================

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
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

interface SectionProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: string;
}

const Section = ({ title, desc, icon: Icon, children, badge }: SectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#131825] border border-slate-800/60 rounded-xl p-6"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 rounded">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

const InputField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  disabled = false,
  note,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  note?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all",
            disabled && "text-slate-500 cursor-not-allowed bg-slate-900/50",
            isPassword && "pr-10"
          )}
        />
        {isPassword && (
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {note && <p className="text-xs text-slate-600">{note}</p>}
    </div>
  );
};

// ============================================================
// Email Settings Component
// ============================================================

function EmailSettings() {
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapUser, setImapUser] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [credLoaded, setCredLoaded] = useState(false);

  useEffect(() => {
    getCredentials().then(creds => {
      if (creds.email_imap_host) setImapHost('••••••');
      if (creds.email_imap_user) setImapUser('••••••');
      if (creds.email_smtp_host) setSmtpHost('••••••');
      setCredLoaded(true);
    }).catch(() => setCredLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [];
      if (imapHost && imapHost !== '••••••') promises.push(setCredential('email_imap_host', imapHost, 'imap'));
      if (imapPort) promises.push(setCredential('email_imap_port', imapPort, 'imap'));
      if (imapUser && imapUser !== '••••••') promises.push(setCredential('email_imap_user', imapUser, 'imap'));
      if (imapPassword) promises.push(setCredential('email_imap_password', imapPassword, 'imap'));
      if (smtpHost && smtpHost !== '••••••') promises.push(setCredential('email_smtp_host', smtpHost, 'smtp'));
      if (smtpPort) promises.push(setCredential('email_smtp_port', smtpPort, 'smtp'));
      if (smtpUser && smtpUser !== '••••••') promises.push(setCredential('email_smtp_user', smtpUser, 'smtp'));
      if (smtpPassword) promises.push(setCredential('email_smtp_password', smtpPassword, 'smtp'));
      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Email (IMAP/SMTP)" desc="Your agent can read and send emails" icon={Mail} badge="Beta">
      <div className="space-y-4">
        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <p className="text-xs text-blue-400/80">
            💡 Supported providers: Gmail, Outlook, Yahoo, ProtonMail Bridge, any IMAP/SMTP server.
            For Gmail, use an App Password (not your regular password).
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IMAP (Incoming) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              Incoming (IMAP)
            </h4>
            <InputField label="IMAP Server" value={imapHost} onChange={setImapHost} placeholder="imap.gmail.com" />
            <InputField label="Port" value={imapPort} onChange={setImapPort} placeholder="993" />
            <InputField label="Username" value={imapUser} onChange={setImapUser} placeholder="you@gmail.com" />
            <InputField label="Password" value={imapPassword} onChange={setImapPassword} placeholder="App password" type="password" />
          </div>

          {/* SMTP (Outgoing) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Upload className="w-4 h-4 text-green-400" />
              Outgoing (SMTP)
            </h4>
            <InputField label="SMTP Server" value={smtpHost} onChange={setSmtpHost} placeholder="smtp.gmail.com" />
            <InputField label="Port" value={smtpPort} onChange={setSmtpPort} placeholder="587" />
            <InputField label="Username" value={smtpUser} onChange={setSmtpUser} placeholder="you@gmail.com" />
            <InputField label="Password" value={smtpPassword} onChange={setSmtpPassword} placeholder="App password" type="password" />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : saving
                ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Email Settings'}
        </button>
      </div>
    </Section>
  );
}

// ============================================================
// GitHub Settings Component
// ============================================================

function GithubSettings() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getCredentials().then(creds => {
      if (creds.github_token) setHasToken(true);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (token) await setCredential('github_token', token, 'github');
      if (username) await setCredential('github_username', username, 'github');
      setSaved(true);
      setHasToken(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save GitHub settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="GitHub" desc="Your agent can manage repos, PRs, and issues" icon={Github} badge="Beta">
      <div className="space-y-4">
        {hasToken && (
          <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">GitHub token configured</span>
          </div>
        )}

        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <p className="text-xs text-blue-400/80">
            🔑 Create a Personal Access Token at{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
              github.com/settings/tokens
            </a>
            {' '}with repo, issues, and pull_request scopes.
          </p>
        </div>

        <InputField label="GitHub Username" value={username} onChange={setUsername} placeholder="octocat" />
        <InputField 
          label="Personal Access Token" 
          value={token} 
          onChange={setToken} 
          placeholder={hasToken ? "••••••••••••••••" : "ghp_xxxxxxxxxxxxxxxxxxxx"} 
          type="password" 
        />

        <button
          onClick={handleSave}
          disabled={saving || (!token && !username)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : saving || (!token && !username)
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save GitHub Settings'}
        </button>
      </div>
    </Section>
  );
}

// ============================================================
// Workspace Browser Component
// ============================================================

function WorkspaceBrowser() {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (dirPath = '') => {
    setLoading(true);
    setError(null);
    try {
      const [wsInfo, fileList] = await Promise.all([
        getWorkspaceInfo(),
        listFiles(dirPath),
      ]);
      setWorkspace(wsInfo);
      setFiles(fileList.files.filter(f => f.name !== '.credentials'));
      setCurrentPath(dirPath);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const navigateToDir = (dirName: string) => {
    const newPath = currentPath ? `${currentPath}/${dirName}` : dirName;
    loadFiles(newPath);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/');
    parts.pop();
    loadFiles(parts.join('/'));
  };

  const handleDownload = async (fileName: string) => {
    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const url = await generateDownloadUrl(filePath);
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Failed to generate download link: ' + err.message);
    }
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === 'directory') return <Folder className="w-4 h-4 text-blue-400" />;
    const ext = entry.name.split('.').pop()?.toLowerCase();
    if (['py', 'js', 'ts', 'jsx', 'tsx'].includes(ext || '')) return <Code className="w-4 h-4 text-green-400" />;
    if (['md', 'txt', 'json', 'csv'].includes(ext || '')) return <File className="w-4 h-4 text-slate-400" />;
    return <File className="w-4 h-4 text-slate-500" />;
  };

  return (
    <Section title="Workspace" desc="Your agent's file storage" icon={FolderOpen} badge="Beta">
      <div className="space-y-4">
        {/* Workspace stats */}
        {workspace && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Files</p>
              <p className="text-lg font-bold text-white">{workspace.fileCount}</p>
            </div>
            <div className="p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Size</p>
              <p className="text-lg font-bold text-white">{formatFileSize(workspace.totalSize)}</p>
            </div>
            <div className="p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Quota</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-white">
                  {Math.round((workspace.totalSize / workspace.maxSize) * 100)}%
                </p>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-1">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min((workspace.totalSize / workspace.maxSize) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs">
          <button 
            onClick={() => loadFiles('')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            ~/workspace
          </button>
          {currentPath.split('/').filter(Boolean).map((part, i, arr) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <button
                onClick={() => loadFiles(arr.slice(0, i + 1).join('/'))}
                className={cn(
                  "font-medium transition-colors",
                  i === arr.length - 1 ? "text-white" : "text-blue-400 hover:text-blue-300"
                )}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => loadFiles(currentPath)}
            className="p-1 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* File list */}
        <div className="bg-[#0B0F1A] rounded-lg border border-slate-800/50 overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => loadFiles(currentPath)} className="text-xs text-blue-400 hover:text-blue-300 mt-2">
                Retry
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Empty directory
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {currentPath && (
                <button
                  onClick={navigateUp}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors text-left"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400">..</span>
                </button>
              )}
              {files
                .sort((a, b) => {
                  if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                  return a.name.localeCompare(b.name);
                })
                .map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors group"
                >
                  {getFileIcon(entry)}
                  {entry.type === 'directory' ? (
                    <button
                      onClick={() => navigateToDir(entry.name)}
                      className="flex-1 text-sm text-white hover:text-blue-400 transition-colors text-left font-medium"
                    >
                      {entry.name}
                    </button>
                  ) : (
                    <span className="flex-1 text-sm text-slate-300">{entry.name}</span>
                  )}
                  {entry.size !== undefined && (
                    <span className="text-[11px] text-slate-600 tabular-nums">{formatFileSize(entry.size)}</span>
                  )}
                  <span className="text-[11px] text-slate-600 tabular-nums hidden sm:block">
                    {new Date(entry.modified).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {entry.type === 'file' && (
                    <button
                      onClick={() => handleDownload(entry.name)}
                      className="p-1 text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// API Keys Component
// ============================================================

function ApiKeysSection() {
  const [credentials, setCredentials] = useState<Record<string, CredentialInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState('anthropic');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCredentials()
      .then(setCredentials)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddKey = async () => {
    if (!newKeyValue) return;
    setSaving(true);
    try {
      await setCredential(`api_key_${newKeyProvider}`, newKeyValue, 'api_key');
      setCredentials(prev => ({
        ...prev,
        [`api_key_${newKeyProvider}`]: { type: 'api_key', set: true, updatedAt: new Date().toISOString() },
      }));
      setNewKeyValue('');
      setShowAddKey(false);
    } catch {
      alert('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Delete this API key?')) return;
    try {
      await deleteCredential(key);
      setCredentials(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      alert('Failed to delete');
    }
  };

  const apiKeys = Object.entries(credentials).filter(([key]) => key.startsWith('api_key_'));

  const providerLabels: Record<string, string> = {
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
    mistral: 'Mistral AI',
    groq: 'Groq',
    perplexity: 'Perplexity',
  };

  return (
    <Section title="API Keys" desc="Bring your own keys (BYOK) for AI models" icon={Key} badge="Beta">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            {apiKeys.length === 0 && !showAddKey && (
              <div className="p-6 bg-[#0B0F1A] rounded-lg border border-slate-800/50 text-center">
                <Key className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-1">No API keys configured</p>
                <p className="text-xs text-slate-600">Your agents use the default model. Add your own keys for more control.</p>
              </div>
            )}

            {apiKeys.map(([key, info]) => {
              const provider = key.replace('api_key_', '');
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Key className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{providerLabels[provider] || provider}</p>
                      <p className="text-[11px] text-slate-500">
                        {info.updatedAt ? `Updated ${new Date(info.updatedAt).toLocaleDateString('fr-FR')}` : 'Configured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 font-medium">Active</span>
                    <button
                      onClick={() => handleDelete(key)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {showAddKey ? (
              <div className="p-4 bg-[#0B0F1A] rounded-lg border border-blue-500/20 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Provider</label>
                  <select
                    value={newKeyProvider}
                    onChange={(e) => setNewKeyProvider(e.target.value)}
                    className="w-full bg-[#131825] border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    {Object.entries(providerLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <InputField
                  label="API Key"
                  value={newKeyValue}
                  onChange={setNewKeyValue}
                  placeholder="sk-..."
                  type="password"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddKey}
                    disabled={saving || !newKeyValue}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      saving || !newKeyValue
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    )}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setShowAddKey(false); setNewKeyValue(''); }}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddKey(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all"
              >
                <Key className="w-4 h-4" />
                Add API Key
              </button>
            )}
          </>
        )}
      </div>
    </Section>
  );
}

// ============================================================
// Main Settings Page
// ============================================================

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { status, gatewayUrl, connect, disconnect, send } = useGateway();
  const { user, profile, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = (displayName[0] || 'U').toUpperCase();

  const [profileName, setProfileName] = useState(displayName);
  const [profileEmail] = useState(user?.email || '');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [emergencyRestarting, setEmergencyRestarting] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    agentAlerts: true,
    weeklyReport: false,
  });
  const [saved, setSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Upload avatar to Supabase Storage
  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      // Create avatars bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarsBucket = buckets?.find(b => b.name === 'avatars');
      
      if (!avatarsBucket) {
        await supabase.storage.createBucket('avatars', { public: true });
      }

      // Upload the file
      const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: profileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Profile save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      
      alert('Un email de réinitialisation a été envoyé à votre adresse e-mail.');
    } catch (error) {
      console.error('Password reset failed:', error);
      alert('Erreur lors de l\'envoi de l\'email de réinitialisation.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.settings.title}</h1>
          <p className="text-xs text-slate-500">{t.settings.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : isSaving
                ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? t.settings.saved : isSaving ? 'Saving...' : t.settings.saveChanges}
        </button>
      </header>

      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
        
        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#131825] border border-red-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.emergencyStop.dangerZone}</h3>
              <p className="text-xs text-slate-500">{t.emergencyStop.dangerZoneDesc}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0B0F1A] rounded-lg border border-red-500/10">
            <div>
              <p className="text-sm font-semibold text-white">{t.emergencyStop.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t.emergencyStop.desc}</p>
            </div>
            <button
              onClick={() => setShowEmergencyConfirm(true)}
              disabled={emergencyRestarting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
                emergencyRestarting
                  ? "bg-red-900/50 text-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 active:scale-95"
              )}
            >
              <OctagonX className="w-4 h-4" />
              {emergencyRestarting ? t.emergencyStop.restarting : t.emergencyStop.button}
            </button>
          </div>
        </motion.div>

        {/* Emergency Confirm Dialog */}
        <AnimatePresence>
          {showEmergencyConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmergencyConfirm(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#131825] border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-full bg-red-500/10">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t.emergencyStop.confirmTitle}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">{t.emergencyStop.confirmDesc}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEmergencyConfirm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    {t.emergencyStop.cancel}
                  </button>
                  <button
                    onClick={async () => {
                      setEmergencyRestarting(true);
                      setShowEmergencyConfirm(false);
                      try {
                        await send('gateway.restart', {});
                      } catch {
                        try {
                          await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pixel-drop.com'}/restart`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json', 
                              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GATEWAY_TOKEN || ''}` 
                            },
                          });
                        } catch {}
                      }
                      setTimeout(() => {
                        setEmergencyRestarting(false);
                        connect(gatewayUrl || 'ws://localhost:18789', '');
                      }, 10000);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95"
                  >
                    <OctagonX className="w-4 h-4" />
                    {t.emergencyStop.confirm}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================================ */}
        {/* NEW BETA SECTIONS */}
        {/* ================================ */}

        {/* Email Settings */}
        <EmailSettings />

        {/* GitHub Settings */}
        <GithubSettings />

        {/* API Keys */}
        <ApiKeysSection />

        {/* Workspace Browser */}
        <WorkspaceBrowser />

        {/* ================================ */}
        {/* EXISTING SECTIONS */}
        {/* ================================ */}

        {/* Profile */}
        <Section title={t.settings.profile} desc={t.settings.profileDesc} icon={User}>
          <div className="space-y-4">
            <div className="flex items-center gap-6 mb-4">
              <div className="relative group">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-16 h-16 rounded-full border-2 border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                    <span className="text-2xl font-bold text-white select-none">{userInitial}</span>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{displayName}</span>
                <span className="text-xs text-slate-500">{user?.email || ''}</span>
              </div>
            </div>
            <InputField label={t.settings.name} value={profileName} onChange={setProfileName} />
            <InputField label={t.settings.email} value={profileEmail} onChange={() => {}} disabled note="L'email ne peut pas être modifié directement" />
            
            <div className="pt-4 space-y-3 border-t border-slate-800">
              <button
                onClick={handleResetPassword}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Key className="w-4 h-4" />
                Réinitialiser le mot de passe
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </Section>

        {/* Billing */}
        <Section title={t.settings.billing} desc={t.settings.billingDesc} icon={CreditCard}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-[#0B0F1A] rounded-lg border border-slate-800/50 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t.settings.currentPlan}</p>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 rounded">
                    Bientôt disponible
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-600">Plan gratuit</p>
                <p className="text-xs text-slate-600 mt-1">Les fonctionnalités de facturation seront disponibles prochainement</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/20" />
              <div className="relative z-10 opacity-50">
                <span className="text-sm font-semibold text-slate-600">0€/mois</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Language */}
        <Section title={t.settings.language} desc={t.settings.languageDesc} icon={Globe}>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('EN')}
              className={cn(
                "flex-1 p-4 rounded-xl border transition-all text-center",
                language === 'EN'
                  ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                  : "bg-[#0B0F1A] border-slate-800 text-slate-400 hover:border-slate-600"
              )}
            >
              <p className="text-2xl mb-2">🇬🇧</p>
              <p className="text-sm font-semibold">{t.settings.english}</p>
            </button>
            <button
              onClick={() => setLanguage('FR')}
              className={cn(
                "flex-1 p-4 rounded-xl border transition-all text-center",
                language === 'FR'
                  ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                  : "bg-[#0B0F1A] border-slate-800 text-slate-400 hover:border-slate-600"
              )}
            >
              <p className="text-2xl mb-2">🇫🇷</p>
              <p className="text-sm font-semibold">{t.settings.french}</p>
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title={t.settings.notifications} desc={t.settings.notificationsDesc} icon={Bell}>
          <div className="space-y-4">
            {[
              { key: 'email' as const, label: t.settings.emailNotif, desc: t.settings.emailNotifDesc },
              { key: 'push' as const, label: t.settings.pushNotif, desc: t.settings.pushNotifDesc },
              { key: 'agentAlerts' as const, label: t.settings.agentAlerts, desc: t.settings.agentAlertsDesc },
              { key: 'weeklyReport' as const, label: t.settings.weeklyReport, desc: t.settings.weeklyReportDesc },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0B0F1A]/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <Toggle
                  enabled={notifications[item.key]}
                  onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Security Info */}
        <Section title="Security" desc="Your data is encrypted and isolated" icon={Shield}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <Shield className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-sm text-white font-medium">End-to-end encryption</p>
                <p className="text-xs text-slate-500">All credentials are encrypted with AES-256</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm text-white font-medium">Isolated workspace</p>
                <p className="text-xs text-slate-500">Your files are in a private sandboxed environment</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <Terminal className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm text-white font-medium">Sandboxed execution</p>
                <p className="text-xs text-slate-500">Code runs in firejail with no network access and resource limits</p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}