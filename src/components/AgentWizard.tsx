import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ChevronRight,
  ChevronLeft,
  X,
  Mail,
  Calendar,
  Target,
  Database,
  Bell,
  BarChart3,
  Share2,
  FolderOpen,
  User,
  Zap,
  Check,
  ShieldAlert,
  Sparkles,
  Lightbulb,
  Rocket,
  Info,
  Loader2,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import type { Agent as SupabaseAgent } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentWizardProps {
  onClose: () => void;
  onLaunch?: (agent: {
    name: string;
    description: string;
    tone: string;
    language: string;
    industry: string;
    photo: string | null;
    skills: string[];
  }) => void;
  /** New: callback that receives the full Supabase agent after creation */
  onAgentCreated?: (agent: SupabaseAgent) => void;
  /** New: external create function from useAgents hook */
  createAgent?: (data: {
    name: string;
    description: string;
    tone: string;
    language: string;
    industry: string;
    photo: string | null;
    skills: string[];
    specialInstructions?: string;
  }) => Promise<SupabaseAgent>;
  /** Current number of agents the user has */
  agentCount?: number;
  /** Whether the current user is an admin (no agent limit) */
  isAdmin?: boolean;
}

type Tone = 'Formal' | 'Friendly' | 'Direct';
type AgentLanguage = 'FR' | 'EN';

interface FormData {
  name: string;
  description: string;
  tone: Tone;
  language: AgentLanguage;
  industry: string;
  specialInstructions: string;
  photo: string | null;
  skills: string[];
}

const INITIAL_DATA: FormData = {
  name: '',
  description: '',
  tone: 'Friendly',
  language: 'FR',
  industry: '',
  specialInstructions: '',
  photo: null,
  skills: [],
};

const StepHint = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1E293B]/50 border border-slate-700/50 mb-6">
    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-300 mb-0.5">{title}</p>
      <p className="text-[11px] text-slate-400 leading-relaxed">{text}</p>
    </div>
  </div>
);

export default function CreateAgentWizard({ onClose, onLaunch, onAgentCreated, createAgent, agentCount = 0, isAdmin = false }: AgentWizardProps) {
  const { t } = useI18n();
  const { isConnected } = useGateway();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isLaunching, setIsLaunching] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const AGENT_LIMIT = 2;
  const limitReached = !isAdmin && agentCount >= AGENT_LIMIT;

  // 3 steps now: Soul (identity), Skills, Review
  const totalSteps = 3;
  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(id)
        ? prev.skills.filter((s) => s !== id)
        : [...prev.skills, id],
    }));
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    setDeployError(null);

    const agentData = {
      name: formData.name || 'New Agent',
      description: formData.description,
      tone: formData.tone,
      language: formData.language,
      industry: formData.industry,
      photo: formData.photo,
      skills: formData.skills,
      specialInstructions: formData.specialInstructions,
    };

    // If we have the createAgent function from useAgents, use it (real Supabase + Gateway flow)
    if (createAgent) {
      try {
        const newAgent = await createAgent(agentData);
        onAgentCreated?.(newAgent);
        // Also call legacy callback for backwards compat
        onLaunch?.(agentData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create agent';
        setDeployError(message);
        // If it's a "saved but gateway failed" error, still notify parent
        if (message.includes('saved but')) {
          onLaunch?.(agentData);
        }
      }
    } else if (isConnected) {
      // Fallback: direct gateway deploy without Supabase (shouldn't happen normally)
      onLaunch?.(agentData);
    } else {
      // Demo mode: mock delay then create locally
      await new Promise((resolve) => setTimeout(resolve, 800));
      onLaunch?.(agentData);
    }

    setIsLaunching(false);
  };

  const SKILLS = [
    { id: 'email', nameKey: 'emailManagement' as const, icon: Mail, descKey: 'emailManagementDesc' as const },
    { id: 'calendar', nameKey: 'calendar' as const, icon: Calendar, descKey: 'calendarDesc' as const },
    { id: 'prospection', nameKey: 'prospection' as const, icon: Target, descKey: 'prospectionDesc' as const },
    { id: 'crm', nameKey: 'crm' as const, icon: Database, descKey: 'crmDesc' as const },
    { id: 'reminders', nameKey: 'reminders' as const, icon: Bell, descKey: 'remindersDesc' as const },
    { id: 'analytics', nameKey: 'analytics' as const, icon: BarChart3, descKey: 'analyticsDesc' as const },
    { id: 'social', nameKey: 'socialMedia' as const, icon: Share2, descKey: 'socialMediaDesc' as const },
    { id: 'files', nameKey: 'fileManagement' as const, icon: FolderOpen, descKey: 'fileManagementDesc' as const },
  ];

  const getToneLabel = (tone: Tone): string => {
    switch (tone) {
      case 'Formal': return t.wizard.formal;
      case 'Friendly': return t.wizard.friendly;
      case 'Direct': return t.wizard.direct;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans antialiased text-slate-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#131825] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header & Progress */}
        <div className="p-6 border-b border-[#1E293B] bg-[#131825]/80 sticky top-0 z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold tracking-tight">{t.wizard.title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="relative flex justify-between items-center px-8">
            <div className="absolute top-1/2 left-0 w-full h-px bg-[#1E293B] -translate-y-1/2 z-0" />
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    step === i
                      ? "bg-[#3B82F6] border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      : step > i
                        ? "bg-[#3B82F6] border-[#3B82F6]"
                        : "bg-[#131825] border-[#1E293B]"
                  )}
                >
                  {step > i ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs font-bold">{i}</span>
                  )}
                </div>
              </div>
            ))}
            <div
              className="absolute top-1/2 left-0 h-px bg-[#3B82F6] transition-all duration-500 -translate-y-1/2 z-0"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* STEP 1: SOUL / Personality */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {limitReached && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-300 mb-0.5">Agent limit reached</p>
                      <p className="text-[11px] text-amber-400/80 leading-relaxed">
                        You already have {agentCount} agents. During the beta, each user is limited to {AGENT_LIMIT} agents. Delete an existing agent to create a new one.
                      </p>
                    </div>
                  </div>
                )}
                <StepHint
                  icon={Sparkles}
                  title={t.wizard.soulHintTitle}
                  text={t.wizard.soulHint}
                />

                <div className="flex flex-col items-center gap-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-24 h-24 rounded-full bg-[#1E293B] border-2 border-dashed border-[#334155] cursor-pointer hover:border-[#3B82F6] transition-all flex items-center justify-center overflow-hidden"
                  >
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-[#475569] group-hover:text-[#3B82F6] transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white">{t.wizard.upload}</p>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.wizard.agentName}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.wizard.agentNamePlaceholder}
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all"
                    />
                  </div>

                  {/* Language selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.wizard.language}</label>
                    <p className="text-[11px] text-slate-500 -mt-1">{t.wizard.languageHint}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['FR', 'EN'] as AgentLanguage[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setFormData({ ...formData, language: lang })}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex items-center gap-3",
                            formData.language === lang
                              ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                              : "bg-[#1E293B]/30 border-[#1E293B] text-slate-400 hover:border-slate-600"
                          )}
                        >
                          <Globe className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {lang === 'FR' ? t.wizard.languageFr : t.wizard.languageEn}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto">{lang === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.wizard.roleDesc}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t.wizard.roleDescPlaceholder}
                      rows={3}
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.wizard.tone}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Formal', 'Friendly', 'Direct'] as Tone[]).map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setFormData({ ...formData, tone })}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                            formData.tone === tone
                              ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                              : "bg-[#1E293B]/30 border-[#1E293B] text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {tone === 'Formal' && <ShieldAlert className="w-5 h-5" />}
                          {tone === 'Friendly' && <User className="w-5 h-5" />}
                          {tone === 'Direct' && <Zap className="w-5 h-5" />}
                          <span className="text-sm font-medium">{getToneLabel(tone)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.wizard.industry}</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder={t.wizard.industryPlaceholder}
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{t.wizard.specialInstructions}</label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                      placeholder={t.wizard.specialInstructionsPlaceholder}
                      rows={2}
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Skills */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepHint
                  icon={Lightbulb}
                  title={t.wizard.skillsHintTitle}
                  text={t.wizard.skillsHint}
                />
                <div className="grid grid-cols-2 gap-4">
                  {SKILLS.map((skill) => {
                    const isActive = formData.skills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={cn(
                          "relative p-5 rounded-xl border text-left transition-all group",
                          isActive
                            ? "bg-[#3B82F6]/5 border-[#3B82F6] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                            : "bg-[#1E293B]/20 border-[#1E293B] hover:border-slate-600"
                        )}
                      >
                        <div
                          className={cn(
                            "mb-4 p-2 rounded-lg inline-block transition-colors",
                            isActive ? "bg-[#3B82F6] text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                          )}
                        >
                          <skill.icon className="w-5 h-5" />
                        </div>
                        <h4 className={cn("text-sm font-semibold mb-1", isActive ? "text-[#3B82F6]" : "text-slate-200")}>
                          {t.wizard[skill.nameKey]}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {t.wizard[skill.descKey]}
                        </p>
                        <div
                          className={cn(
                            "absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                            isActive ? "bg-[#3B82F6] border-[#3B82F6]" : "border-slate-700"
                          )}
                        >
                          {isActive && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <StepHint
                  icon={Rocket}
                  title={t.wizard.reviewHintTitle}
                  text={t.wizard.reviewHint}
                />

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#3B82F6]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Zap className="w-12 h-12 text-[#3B82F6]" />
                  </div>
                  <div className="flex gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-[#131825] border-2 border-[#3B82F6] flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {formData.photo ? (
                        <img src={formData.photo} alt="Agent" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-slate-600" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{formData.name || "[Agent Name]"}</h3>
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 uppercase font-bold tracking-wider">
                          {t.agents.active}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {formData.description || t.wizard.roleDescPlaceholder}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#1E293B]/30 border border-[#1E293B] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">{t.wizard.coreIdentity}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t.wizard.industry}</span>
                        <span className="text-slate-200">{formData.industry || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t.wizard.tone}</span>
                        <span className="text-slate-200">{getToneLabel(formData.tone)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t.wizard.language}</span>
                        <span className="text-slate-200">
                          {formData.language === 'FR' ? `${t.wizard.languageFr} 🇫🇷` : `${t.wizard.languageEn} 🇬🇧`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t.wizard.type}</span>
                        <span className="text-slate-200">{t.wizard.autonomous}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1E293B]/30 border border-[#1E293B] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">{t.wizard.capabilities}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.length > 0 ? (
                        formData.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700 font-medium capitalize"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">{t.wizard.noSkills}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Channels note */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <Info className="w-4 h-4 text-blue-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t.wizard.channelsConfiguredLater}
                  </p>
                </div>

                {deployError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{deployError}</p>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  {limitReached && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>Agent limit reached ({AGENT_LIMIT} max during beta). Delete an existing agent to create a new one.</p>
                    </div>
                  )}
                  <button
                    onClick={handleLaunch}
                    disabled={isLaunching || limitReached}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    {isLaunching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {isLaunching ? t.wizard.launching : t.wizard.launchAgent}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-semibold py-4 rounded-xl border border-slate-700 transition-all"
                  >
                    {t.wizard.saveAsDraft}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-[#1E293B] bg-[#131825]/80 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all",
              step === 1 ? "opacity-0 pointer-events-none" : "hover:bg-[#1E293B] text-slate-400"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            {t.wizard.back}
          </button>

          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {t.wizard.step} {step} {t.wizard.of} {totalSteps}
          </span>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/10"
            >
              {t.wizard.continue}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-[100px]" />
          )}
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #131825;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3B82F6;
        }
      `}</style>
    </div>
  );
}
