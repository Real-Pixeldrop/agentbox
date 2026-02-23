"use client";

import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  OctagonX,
  Upload,
  LogOut,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

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
  const { status, gatewayUrl, connect, disconnect, send } = useGateway();
  const { user, profile, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = (displayName[0] || 'U').toUpperCase();

  const [profileName, setProfileName] = useState(displayName);
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [emergencyRestarting, setEmergencyRestarting] = useState(false);
  const [gwUrl, setGwUrl] = useState(gatewayUrl || 'ws://localhost:18789');
  const [gwToken, setGwToken] = useState('');
  const [showGwToken, setShowGwToken] = useState(false);
  const [gwTesting, setGwTesting] = useState(false);
  const [gwTestResult, setGwTestResult] = useState<'success' | 'error' | null>(null);
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
      const { data, error } = await supabase.storage
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
          {saved ? (
            <Check className="w-4 h-4" />
          ) : isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? t.settings.saved : isSaving ? 'Sauvegarde...' : t.settings.saveChanges}
        </button>
      </header>

      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
        {/* Danger Zone - Emergency Stop */}
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

        {/* Emergency Stop Confirmation Dialog */}
        {showEmergencyConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmergencyConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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
                      // Try gateway.restart command first
                      await send('gateway.restart', {});
                    } catch (error) {
                      console.log('Gateway restart command failed, trying HTTP fallback:', error);
                      // Fallback: HTTP POST request to restart the gateway
                      try {
                        await fetch('https://gateway.pixel-drop.com/restart', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer FiqqVnVF--ZU7Ubej663Xzjh4uuu0YMqwF12-z_xWSM',
                          },
                        });
                      } catch (httpError) {
                        console.error('HTTP restart also failed:', httpError);
                      }
                    }
                    // Wait 10 seconds, then try to reconnect
                    setTimeout(() => {
                      setEmergencyRestarting(false);
                      // Try to reconnect to gateway
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
                  {isUploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
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
                disabled
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-600">L'email ne peut pas être modifié directement</p>
            </div>
            
            {/* Action buttons */}
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

        {/* API Keys */}
        <Section title={t.settings.apiKeys} desc={t.settings.apiKeysDesc} icon={Key}>
          <div className="space-y-4">
            <div className="p-6 bg-[#0B0F1A] rounded-lg border border-slate-800/50 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 rounded">
                  Bientôt disponible
                </span>
              </div>
              <p className="text-sm text-slate-600">La gestion des clés API sera disponible dans une prochaine version.</p>
              <p className="text-xs text-slate-700 mt-2">Vos agents utilisent actuellement les modèles configurés par défaut.</p>
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
