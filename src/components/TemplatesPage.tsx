"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserSearch, 
  Inbox, 
  Briefcase, 
  Share2, 
  PenTool, 
  Globe, 
  Headset, 
  MessageSquare, 
  FileText, 
  PieChart, 
  Plus,
  ArrowRight,
  Search
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type Category = 'All' | 'Business' | 'Marketing' | 'Support' | 'Finance' | 'Custom';

interface Template {
  id: string;
  nameKey: string;
  descKey: string;
  category: Category;
  icon: React.ElementType;
  preconfigures: {
    soul: boolean;
    skills: string[];
    channels: string[];
  };
}

const CATEGORIES: { labelKey: string; label: Category; color: string }[] = [
  { labelKey: 'all', label: 'All', color: '#3B82F6' },
  { labelKey: 'business', label: 'Business', color: '#3B82F6' },
  { labelKey: 'marketing', label: 'Marketing', color: '#8B5CF6' },
  { labelKey: 'support', label: 'Support', color: '#22C55E' },
  { labelKey: 'finance', label: 'Finance', color: '#F59E0B' },
  { labelKey: 'custom', label: 'Custom', color: '#6B7280' },
];

const TEMPLATES: Template[] = [
  { id: '1', nameKey: 'salesProspector', descKey: 'salesProspectorDesc', category: 'Business', icon: UserSearch, preconfigures: { soul: true, skills: ['Prospection', 'CRM', 'Email'], channels: ['WhatsApp', 'Email'] } },
  { id: '2', nameKey: 'emailManager', descKey: 'emailManagerDesc', category: 'Business', icon: Inbox, preconfigures: { soul: true, skills: ['Email', 'Reminders'], channels: ['Email'] } },
  { id: '3', nameKey: 'meetingPrep', descKey: 'meetingPrepDesc', category: 'Business', icon: Briefcase, preconfigures: { soul: true, skills: ['Calendar', 'Email', 'Analytics'], channels: ['Email', 'Slack'] } },
  { id: '4', nameKey: 'socialMediaManager', descKey: 'socialMediaManagerDesc', category: 'Marketing', icon: Share2, preconfigures: { soul: true, skills: ['Social Media', 'Analytics'], channels: ['Telegram', 'Discord'] } },
  { id: '5', nameKey: 'contentWriter', descKey: 'contentWriterDesc', category: 'Marketing', icon: PenTool, preconfigures: { soul: true, skills: ['File Management', 'Analytics'], channels: ['Email'] } },
  { id: '6', nameKey: 'seoAnalyst', descKey: 'seoAnalystDesc', category: 'Marketing', icon: Globe, preconfigures: { soul: true, skills: ['Analytics', 'Reminders'], channels: ['Email', 'Slack'] } },
  { id: '7', nameKey: 'customerSupport', descKey: 'customerSupportDesc', category: 'Support', icon: Headset, preconfigures: { soul: true, skills: ['Email', 'CRM', 'Reminders'], channels: ['WhatsApp', 'Email', 'Discord'] } },
  { id: '8', nameKey: 'feedbackCollector', descKey: 'feedbackCollectorDesc', category: 'Support', icon: MessageSquare, preconfigures: { soul: true, skills: ['Email', 'Analytics'], channels: ['Email', 'WhatsApp'] } },
  { id: '9', nameKey: 'invoiceTracker', descKey: 'invoiceTrackerDesc', category: 'Finance', icon: FileText, preconfigures: { soul: true, skills: ['Email', 'Reminders', 'CRM'], channels: ['Email'] } },
  { id: '10', nameKey: 'expenseReporter', descKey: 'expenseReporterDesc', category: 'Finance', icon: PieChart, preconfigures: { soul: true, skills: ['Analytics', 'File Management'], channels: ['Email'] } },
  { id: '11', nameKey: 'customAgent', descKey: 'customAgentDesc', category: 'Custom', icon: Plus, preconfigures: { soul: false, skills: [], channels: [] } },
];

const getCategoryColor = (category: Category) => {
  return CATEGORIES.find(c => c.label === category)?.color || '#6B7280';
};

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<Category>('All');
  const { t } = useI18n();
  
  const filteredTemplates = activeTab === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(tp => tp.category === activeTab);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 selection:bg-[#3B82F6]/30 selection:text-white pb-20">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-[#3B82F6]/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                {t.templates.title}
              </h1>
              <p className="text-lg text-slate-400">
                {t.templates.subtitle}
              </p>
            </motion.div>
          </div>
          
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#3B82F6] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t.templates.searchPlaceholder}
              className="w-full bg-[#131825] border border-[#1E293B] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#131825] border border-[#1E293B] rounded-xl w-fit mb-12 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveTab(cat.label)}
              className={`relative px-6 py-2 text-sm font-medium transition-all duration-300 rounded-lg whitespace-nowrap ${
                activeTab === cat.label ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {activeTab === cat.label && (
                <motion.div
                  layoutId="activeTemplateTab"
                  className="absolute inset-0 bg-[#1E293B] shadow-lg rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{t.templates[cat.labelKey as keyof typeof t.templates]}</span>
            </button>
          ))}
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => {
              const accentColor = getCategoryColor(template.category);
              const name = t.templates[template.nameKey as keyof typeof t.templates] || template.nameKey;
              const desc = t.templates[template.descKey as keyof typeof t.templates] || template.descKey;
              const catLabel = t.templates[template.category.toLowerCase() as keyof typeof t.templates] || template.category;
              
              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="group relative flex flex-col h-full p-6 rounded-2xl bg-[#131825] border border-[#1E293B] hover:border-[#3B82F6]/50 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div 
                      className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] blur-[80px] rounded-full"
                      style={{ backgroundColor: `${accentColor}15` }}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center border transition-colors duration-300"
                        style={{ 
                          backgroundColor: `${accentColor}10`,
                          borderColor: `${accentColor}25`,
                          color: accentColor 
                        }}
                      >
                        <template.icon size={24} strokeWidth={1.5} />
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border"
                        style={{ 
                          backgroundColor: `${accentColor}05`,
                          borderColor: `${accentColor}20`,
                          color: accentColor 
                        }}
                      >
                        {catLabel}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#3B82F6] transition-colors">
                      {name}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-grow">
                      {desc}
                    </p>

                    {/* OpenClaw pre-configuration info */}
                    {(template.preconfigures.soul || template.preconfigures.skills.length > 0) && (
                      <div className="mb-4 p-3 rounded-lg bg-[#0D1117] border border-[#1E293B]/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">{t.templateDetail.preconfigures}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {template.preconfigures.soul && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              SOUL.md
                            </span>
                          )}
                          {template.preconfigures.skills.map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              {skill}
                            </span>
                          ))}
                          {template.preconfigures.channels.map(ch => (
                            <span key={ch} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button className="group/btn relative w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E293B] hover:bg-[#3B82F6] text-white text-sm font-medium transition-all duration-300 overflow-hidden">
                      <span className="relative z-10">{t.templates.useTemplate}</span>
                      <ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredTemplates.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-40 border border-dashed border-[#1E293B] rounded-3xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#131825] border border-[#1E293B] flex items-center justify-center text-slate-600 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">{t.templates.noTemplates}</h3>
            <p className="text-slate-500">{t.templates.noTemplatesDesc}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
