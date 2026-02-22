// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - clsx (npm install clsx)
// - tailwind-merge (npm install tailwind-merge)

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  MessageSquare, 
  Mail, 
  Send, 
  Smartphone,
  Hash,
  Radio, 
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
  Briefcase,
  ShieldAlert,
  Settings2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 
 * Utility for Tailwind class merging 
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentWizardProps {
  onClose: () => void;
}

type Tone = 'Formal' | 'Friendly' | 'Direct';
// Industry is now free text

interface FormData {
  name: string;
  description: string;
  tone: Tone;
  industry: string;
  specialInstructions: string;
  photo: string | null;
  channels: {
    whatsapp: { enabled: boolean; value: string };
    email: { enabled: boolean; value: string };
    telegram: { enabled: boolean; value: string };
    discord: { enabled: boolean; value: string };
    slack: { enabled: boolean; value: string };
    signal: { enabled: boolean; value: string };
    imessage: { enabled: boolean; value: string };
  };
  skills: string[];
}

const INITIAL_DATA: FormData = {
  name: '',
  description: '',
  tone: 'Friendly',
  industry: '',
  specialInstructions: '',
  photo: null,
  channels: {
    whatsapp: { enabled: false, value: '' },
    email: { enabled: false, value: '' },
    telegram: { enabled: false, value: '' },
    discord: { enabled: false, value: '' },
    slack: { enabled: false, value: '' },
    signal: { enabled: false, value: '' },
    imessage: { enabled: false, value: '' },
  },
  skills: [],
};

const SKILLS = [
  { id: 'email', name: 'Email Management', icon: Mail, desc: 'Read, classify and respond to emails' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, desc: 'Schedule meetings, manage availability' },
  { id: 'prospection', name: 'Prospection', icon: Target, desc: 'Find and qualify leads' },
  { id: 'crm', name: 'CRM', icon: Database, desc: 'Manage contacts and pipeline' },
  { id: 'reminders', name: 'Reminders', icon: Bell, desc: 'Set and track reminders' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, desc: 'Monitor KPIs and generate reports' },
  { id: 'social', name: 'Social Media', icon: Share2, desc: 'Manage posts and engagement' },
  { id: 'files', name: 'File Management', icon: FolderOpen, desc: 'Organize and search documents' },
];

export default function CreateAgentWizard({ onClose }: AgentWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
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
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(id) 
        ? prev.skills.filter(s => s !== id) 
        : [...prev.skills, id]
    }));
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
            <h2 className="text-xl font-semibold tracking-tight">Create AI Agent</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="relative flex justify-between items-center px-4">
            <div className="absolute top-1/2 left-0 w-full h-px bg-[#1E293B] -translate-y-1/2 z-0" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    step === i ? "bg-[#3B82F6] border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.5)]" : 
                    step > i ? "bg-[#3B82F6] border-[#3B82F6]" : "bg-[#131825] border-[#1E293B]"
                  )}
                >
                  {step > i ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs font-bold">{i}</span>}
                </div>
              </div>
            ))}
            <div 
              className="absolute top-1/2 left-0 h-px bg-[#3B82F6] transition-all duration-500 -translate-y-1/2 z-0" 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
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
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white">Upload</p>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Agent Name</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Nexus One"
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Role & Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe the primary function of this agent..."
                      rows={3}
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Communication Tone</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Formal', 'Friendly', 'Direct'] as Tone[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setFormData({...formData, tone: t})}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                            formData.tone === t 
                              ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                              : "bg-[#1E293B]/30 border-[#1E293B] text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {t === 'Formal' && <ShieldAlert className="w-5 h-5" />}
                          {t === 'Friendly' && <User className="w-5 h-5" />}
                          {t === 'Direct' && <Zap className="w-5 h-5" />}
                          <span className="text-sm font-medium">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Industry Sector</label>
                    <input 
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      placeholder="e.g. Real Estate, SaaS, Healthcare, E-commerce..."
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Special Instructions (Optional)</label>
                    <textarea 
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                      placeholder="Any specific behavior or rules..."
                      rows={2}
                      className="w-full bg-[#1E293B]/50 border border-[#1E293B] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all resize-none"
                    />
                  </div>

                  {/* OpenClaw SOUL.md hint */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <Settings2 className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This step creates your agent&apos;s <span className="text-blue-400 font-mono font-bold">SOUL.md</span> — the personality file that defines how your agent thinks, speaks, and behaves. The agent name becomes the folder name in OpenClaw.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {[
                  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'text-[#25D366]', placeholder: '+33 6 12 34 56 78' },
                  { id: 'email', name: 'Email (IMAP/SMTP)', icon: Mail, color: 'text-[#EA4335]', placeholder: 'agent@company.com' },
                  { id: 'telegram', name: 'Telegram', icon: Send, color: 'text-[#0088CC]', placeholder: 'Bot Token' },
                  { id: 'discord', name: 'Discord', icon: Hash, color: 'text-[#5865F2]', placeholder: 'Bot Token' },
                  { id: 'slack', name: 'Slack', icon: Hash, color: 'text-[#E01E5A]', placeholder: 'Workspace Token' },
                  { id: 'signal', name: 'Signal', icon: Radio, color: 'text-[#3A76F0]', placeholder: '+33 6 12 34 56 78' },
                  { id: 'imessage', name: 'iMessage', icon: Smartphone, color: 'text-[#34C759]', badge: 'Premium' },
                ].map((channel) => (
                  <div key={channel.id} className="bg-[#1E293B]/30 border border-[#1E293B] rounded-xl p-4 space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg bg-slate-800/50", channel.color)}>
                          <channel.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {channel.name}
                            {channel.badge && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold tracking-tight uppercase">
                                {channel.badge}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setFormData({
                          ...formData, 
                          channels: { 
                            ...formData.channels, 
                            [channel.id]: { ...formData.channels[channel.id as keyof typeof formData.channels], enabled: !formData.channels[channel.id as keyof typeof formData.channels].enabled } 
                          }
                        })}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors duration-300",
                          formData.channels[channel.id as keyof typeof formData.channels].enabled ? "bg-[#3B82F6]" : "bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                          formData.channels[channel.id as keyof typeof formData.channels].enabled ? "left-6" : "left-1"
                        )} />
                      </button>
                    </div>
                    
                    {formData.channels[channel.id as keyof typeof formData.channels].enabled && channel.id !== 'imessage' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2"
                      >
                        <input 
                          type="text"
                          placeholder={channel.placeholder}
                          value={formData.channels[channel.id as keyof typeof formData.channels].value}
                          onChange={(e) => setFormData({
                            ...formData, 
                            channels: { 
                              ...formData.channels, 
                              [channel.id]: { ...formData.channels[channel.id as keyof typeof formData.channels], value: e.target.value } 
                            }
                          })}
                          className="w-full bg-[#131825] border border-[#1E293B] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-4"
              >
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
                      <div className={cn(
                        "mb-4 p-2 rounded-lg inline-block transition-colors",
                        isActive ? "bg-[#3B82F6] text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                      )}>
                        <skill.icon className="w-5 h-5" />
                      </div>
                      <h4 className={cn("text-sm font-semibold mb-1", isActive ? "text-[#3B82F6]" : "text-slate-200")}>
                        {skill.name}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {skill.desc}
                      </p>
                      <div className={cn(
                        "absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                        isActive ? "bg-[#3B82F6] border-[#3B82F6]" : "border-slate-700"
                      )}>
                        {isActive && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
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
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 uppercase font-bold tracking-wider">Active</span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {formData.description || "The primary configuration for your autonomous workspace intelligence..."}
                      </p>
                      <div className="flex gap-2 pt-2">
                        {Object.entries(formData.channels).filter(([_, v]) => v.enabled).map(([k]) => (
                          <div key={k} className="p-1.5 rounded-md bg-[#131825] border border-[#1E293B]">
                             {k === 'whatsapp' && <MessageSquare className="w-3 h-3 text-[#25D366]" />}
                             {k === 'email' && <Mail className="w-3 h-3 text-[#EA4335]" />}
                             {k === 'telegram' && <Send className="w-3 h-3 text-[#0088CC]" />}
                             {k === 'discord' && <Hash className="w-3 h-3 text-[#5865F2]" />}
                             {k === 'slack' && <Hash className="w-3 h-3 text-[#E01E5A]" />}
                             {k === 'signal' && <Radio className="w-3 h-3 text-[#3A76F0]" />}
                             {k === 'imessage' && <Smartphone className="w-3 h-3 text-[#34C759]" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#1E293B]/30 border border-[#1E293B] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Core Identity</p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Industry</span>
                        <span className="text-slate-200">{formData.industry}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tone</span>
                        <span className="text-slate-200">{formData.tone}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Type</span>
                        <span className="text-slate-200">Autonomous</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1E293B]/30 border border-[#1E293B] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Capabilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.length > 0 ? formData.skills.map(s => (
                        <span key={s} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700 font-medium capitalize">
                          {s}
                        </span>
                      )) : (
                        <span className="text-[10px] text-slate-600 italic">No skills selected</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group">
                    <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    Launch Agent
                  </button>
                  <button className="w-full bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-semibold py-4 rounded-xl border border-slate-700 transition-all">
                    Save as Draft
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
            Back
          </button>

          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Step {step} of 4
          </span>

          {step < 4 ? (
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/10"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
             <div className="w-[100px]" /> /* Spacer to keep center text centered */
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
