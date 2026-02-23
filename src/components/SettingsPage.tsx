"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
}

const Section = ({ title, desc, icon: Icon, children }: SectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#131825] border border-slate-800/60 rounded-xl p-6"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { status, gatewayUrl, connect, disconnect } = useGateway();

  const [profileName, setProfileName] = useState('Akli Goudjil');
  const [profileEmail, setProfileEmail] = useState('akli@pixel-drop.com');
  const [gwUrl, setGwUrl] = useState(gatewayUrl || 'ws://localhost:18789');
  const [gwToken, setGwToken] = useState('');
  const [showGwToken, setShowGwToken] = useState(false);
  const [gwTesting, setGwTesting] = useState(false);
  const [gwTestResult, setGwTestResult] = useState<'success' | 'error' | null>(null);
  const [openaiKey, setOpenaiKey] = useState('sk-...xxxx');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    agentAlerts: true,
    weeklyReport: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.settings.title}</h1>
          <p className="text-xs text-slate-500">{t.settings.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? t.settings.saved : t.settings.saveChanges}
        </button>
      </header>

      <div className="p-8 max-w-3xl mx-auto space-y-6">
        {/* Gateway Connection - HIDDEN FROM USERS */}
        <div style={{ display: 'none' }}>
        <Section title={t.gateway.title} desc={t.gateway.desc} icon={Wifi}>
          <div className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0B0F1A] border border-slate-800/50">
              <div className={cn(
                "w-3 h-3 rounded-full flex-shrink-0",
                status === 'connected'
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  : status === 'connecting'
                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    : "bg-red-500/60"
              )} />
              <span className="text-sm text-slate-300 font-medium">
                {status === 'connected' ? t.gateway.connected : status === 'connecting' ? t.gateway.connecting : t.gateway.disconnected}
              </span>
              {status === 'connected' && (
                <button
                  onClick={() => disconnect()}
                  className="ml-auto text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>

            {gwTestResult && (
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-xs font-medium",
                gwTestResult === 'success'
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              )}>
                {gwTestResult === 'success' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                {gwTestResult === 'success' ? t.gateway.connectionSuccess : t.gateway.connectionFailed}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.gateway.url}</label>
              <input
                type="text"
                value={gwUrl}
                onChange={(e) => setGwUrl(e.target.value)}
                placeholder={t.gateway.urlPlaceholder}
                className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.gateway.token}</label>
              <div className="relative">
                <input
                  type={showGwToken ? 'text' : 'password'}
                  value={gwToken}
                  onChange={(e) => setGwToken(e.target.value)}
                  placeholder={t.gateway.tokenPlaceholder}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  onClick={() => setShowGwToken(!showGwToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showGwToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={async () => {
                setGwTesting(true);
                setGwTestResult(null);
                try {
                  await connect(gwUrl, gwToken);
                  setGwTestResult('success');
                } catch {
                  setGwTestResult('error');
                }
                setGwTesting(false);
              }}
              disabled={!gwUrl || gwTesting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
                !gwUrl || gwTesting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
              )}
            >
              {gwTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              {gwTesting ? t.gateway.testing : t.gateway.testConnection}
            </button>
          </div>
        </Section>
        </div>

        {/* Profile */}
        <Section title={t.settings.profile} desc={t.settings.profileDesc} icon={User}>
          <div className="space-y-4">
            <div className="flex items-center gap-6 mb-4">
              <div className="relative group">
                <img
                  src="https://randomuser.me/api/portraits/men/91.jpg"
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border-2 border-slate-700 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <button className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                {t.settings.changeAvatar}
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.settings.name}</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.settings.email}</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>
        </Section>

        {/* Billing */}
        <Section title={t.settings.billing} desc={t.settings.billingDesc} icon={CreditCard}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t.settings.currentPlan}</p>
                <p className="text-lg font-bold text-white mt-1">{t.settings.proPlan}</p>
              </div>
              <span className="text-sm font-semibold text-blue-400">{t.settings.monthlyPrice}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">{t.settings.usage}</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{t.settings.agentsUsed}</span>
                    <span className="text-slate-300 font-medium">4 / 10</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{t.settings.messagesThisMonth}</span>
                    <span className="text-slate-300 font-medium">2,847 / 10,000</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{t.settings.storageUsed}</span>
                    <span className="text-slate-300 font-medium">1.2 GB / 5 GB</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* API Keys */}
        <Section title={t.settings.apiKeys} desc={t.settings.apiKeysDesc} icon={Key}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.settings.openaiKey}</label>
              <div className="relative">
                <input
                  type={showOpenai ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={t.settings.pasteKey}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.settings.anthropicKey}</label>
              <div className="relative">
                <input
                  type={showAnthropic ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder={t.settings.pasteKey}
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
      </div>
    </div>
  );
}
