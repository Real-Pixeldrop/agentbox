"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, 
  ArrowUp, 
  AlertCircle, 
  Calendar, 
  Mail,
  ChevronDown,
  Bot,
  Check,
  Sparkles,
  X,
  ImageIcon,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format model id into a clean display name */
function formatModelName(model: string): string {
  // "anthropic/claude-opus-4-6" -> "Claude Opus 4.6"
  // "openai/gpt-4o" -> "GPT-4o"
  const slug = model.includes('/') ? model.split('/').pop()! : model;
  return slug
    .replace(/^claude-/, 'Claude ')
    .replace(/^gpt-/, 'GPT-')
    .replace(/^gemini-/, 'Gemini ')
    .replace(/-(\d+)-(\d+)$/, ' $1.$2')  // opus-4-6 -> Opus 4.6
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/^Claude\s+/, 'Claude ')     // fix double-cap
    .replace(/^Gpt/, 'GPT')
    .trim();
}

interface HomeAgent {
  id: number;
  name: string;
  photo: string;
  active: boolean;
  sessionKey?: string;
}

interface HomePageProps {
  agents?: HomeAgent[];
  activeModel?: string;
  onSendMessage?: (message: string, agentId: number | null) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1] as [number, number, number, number],
    },
  },
};

export default function HomePage({ agents = [], activeModel, onSendMessage }: HomePageProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<HomeAgent | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [modelName, setModelName] = useState(activeModel || '');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const { isConnected, send } = useGateway();

  // Fetch model from gateway config
  useEffect(() => {
    if (activeModel) {
      setModelName(activeModel);
      return;
    }
    if (!isConnected) return;
    send<Record<string, unknown>>('config.get', {}).then((config) => {
      const agents_config = config?.agents as Record<string, unknown> | undefined;
      const defaults = agents_config?.defaults as Record<string, unknown> | undefined;
      const model = (defaults?.model as string) || (config?.model as string) || '';
      if (model) setModelName(model);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, activeModel]);

  const activeAgents = agents.filter(a => a.active);

  // Close picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowAgentPicker(false);
      }
    };
    if (showAgentPicker) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showAgentPicker]);

  // Image attachment handlers
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleFileSelect(file);
        break;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !attachedImage) return;
    
    const message = inputValue.trim();
    setInputValue("");
    setAttachedImage(null);

    // Determine session key
    let sessionKey = 'agent:main:main'; // Default to main agent
    if (selectedAgent?.sessionKey) {
      sessionKey = selectedAgent.sessionKey;
    }

    try {
      // Send message via gateway if connected
      if (isConnected) {
        await send('chat.send', {
          sessionKey,
          message,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    // Always call the parent handler to navigate to conversation
    if (onSendMessage) {
      onSendMessage(message, selectedAgent?.id ?? null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const suggestions = [
    {
      id: 'urgent',
      text: t.home.suggestion1,
      icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'meetings',
      text: t.home.suggestion2,
      icon: <Calendar className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'emails',
      text: t.home.suggestion3,
      icon: <Mail className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0B0F1A] text-slate-200 selection:bg-blue-500/30">
      
      {/* BACKGROUND ATMOSPHERE */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-[0.1]" 
          style={{ 
            backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-3xl px-4 sm:px-6 flex flex-col items-center"
      >
        
        {/* LOGO / ACCENT */}
        <motion.div variants={itemVariants} className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#1E293B] bg-[#131825]/50 backdrop-blur-sm">
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isConnected ? "bg-green-500 animate-pulse" : "bg-slate-500"
            )} />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium text-slate-400">{t.home.badge}</span>
          </div>
          {modelName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#1E293B] bg-[#131825]/50 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">{formatModelName(modelName)}</span>
            </div>
          )}
        </motion.div>

        {/* HERO TITLE */}
        <motion.h1 
          variants={itemVariants}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-center mb-10 px-2"
        >
          <span className="bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent">
            {t.home.title}
          </span>
        </motion.h1>

        {/* SEARCH / INPUT BAR */}
        <motion.div 
          variants={itemVariants}
          className="group relative w-full mb-8"
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />

          {/* Drag overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-blue-600/10 border-2 border-dashed border-blue-500/50 rounded-[20px] backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                  <ImageIcon className="w-5 h-5" />
                  {t.attachments.dropzone}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image preview */}
          <AnimatePresence>
            {attachedImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mb-2 overflow-hidden"
              >
                <div className="relative inline-block ml-4">
                  <img
                    src={attachedImage}
                    alt={t.attachments.attachedImage}
                    className="max-h-20 rounded-xl border border-slate-700"
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-slate-300">
                    {t.attachments.attachedImage}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative flex items-center bg-[#131825] border border-[#1E293B] rounded-[20px] p-2 shadow-2xl transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            
            {/* Agent Selector */}
            <div className="relative pl-2 pr-1" ref={pickerRef}>
              <button
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-sm",
                  selectedAgent 
                    ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" 
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                )}
              >
                {selectedAgent ? (
                  <>
                    {selectedAgent.photo ? (
                      <img src={selectedAgent.photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[9px] font-bold">
                        {selectedAgent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium max-w-[100px] truncate">{selectedAgent.name}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium hidden sm:inline">{t.home.auto || 'Auto'}</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Agent Picker Dropdown */}
              <AnimatePresence>
                {showAgentPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-64 bg-[#131825] border border-slate-700/80 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                  >
                    {/* Auto option */}
                    <button
                      onClick={() => { setSelectedAgent(null); setShowAgentPicker(false); }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors",
                        !selectedAgent 
                          ? "bg-blue-500/10 text-blue-400" 
                          : "text-slate-300 hover:bg-slate-800/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{t.home.autoRoute || 'Auto-routing'}</div>
                        <div className="text-[11px] text-slate-500">{t.home.autoRouteDesc || 'Routes to the best agent'}</div>
                      </div>
                      {!selectedAgent && <Check className="w-4 h-4 text-blue-400" />}
                    </button>

                    {activeAgents.length > 0 && (
                      <div className="border-t border-slate-800/60">
                        <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                          {t.home.yourAgents || 'Your agents'}
                        </div>
                        {activeAgents.map(agent => (
                          <button
                            key={agent.id}
                            onClick={() => { setSelectedAgent(agent); setShowAgentPicker(false); }}
                            className={cn(
                              "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors",
                              selectedAgent?.id === agent.id 
                                ? "bg-blue-500/10 text-blue-400" 
                                : "text-slate-300 hover:bg-slate-800/50"
                            )}
                          >
                            {agent.photo ? (
                              <img src={agent.photo} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                            ) : (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold border border-slate-700">
                                {agent.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="flex-1 text-left font-medium truncate">{agent.name}</span>
                            {selectedAgent?.id === agent.id && <Check className="w-4 h-4 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeAgents.length === 0 && (
                      <div className="px-4 py-4 text-center text-sm text-slate-500 border-t border-slate-800/60">
                        <Bot className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                        <div>{t.home.noAgents || 'No active agents'}</div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-700/50 mx-1" />
            
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={selectedAgent ? `${t.home.talkTo || 'Talk to'} ${selectedAgent.name}...` : t.home.placeholder}
              className="w-full bg-transparent border-none outline-none py-3 px-2 text-sm sm:text-lg text-slate-100 placeholder:text-slate-600"
            />

            <div className="flex items-center gap-1.5 pr-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all active:scale-95"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = '';
                }}
              />
              <button 
                onClick={handleSend}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300 active:scale-90",
                  (inputValue.length > 0 || attachedImage)
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-blue-500" 
                    : "bg-slate-800/50 text-slate-500"
                )}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* SUGGESTION PILLS */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full sm:w-auto px-2 sm:px-0"
        >
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSuggestionClick(item.text)}
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#131825] border border-[#1E293B] hover:border-slate-600 hover:bg-[#1c2436] transition-all duration-200 text-sm text-slate-400 hover:text-slate-200 shadow-sm hover:shadow-md text-left"
            >
              <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </span>
              <span className="font-medium">{item.text}</span>
            </button>
          ))}
        </motion.div>

        {/* AI Disclaimer */}
        <motion.div
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <p className="text-[10px] text-slate-600">{t.disclaimer.text}</p>
        </motion.div>

      </motion.div>

      {/* FOOTER HINT */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-[11px] font-medium tracking-widest text-slate-600 uppercase hidden sm:flex items-center gap-4"
      >
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/50 font-sans">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/50 font-sans">K</kbd>
          <span className="ml-1 opacity-60">{t.home.commands}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-800" />
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/50 font-sans">L</kbd>
          <span className="ml-1 opacity-60">{t.home.searchLogs}</span>
        </div>
      </motion.div>

      {/* DECORATIVE MESH CORNERS */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </main>
  );
}
