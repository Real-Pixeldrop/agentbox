"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Paperclip, 
  Mic, 
  ArrowUp, 
  AlertCircle, 
  Calendar, 
  Mail,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const { t } = useI18n();

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
        className="relative z-10 w-full max-w-3xl px-6 flex flex-col items-center"
      >
        
        {/* LOGO / ACCENT */}
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-2 px-3 py-1 rounded-full border border-[#1E293B] bg-[#131825]/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-slate-400">{t.home.badge}</span>
        </motion.div>

        {/* HERO TITLE */}
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-6xl font-semibold tracking-tight text-center mb-10"
        >
          <span className="bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent">
            {t.home.title}
          </span>
        </motion.h1>

        {/* SEARCH / INPUT BAR */}
        <motion.div 
          variants={itemVariants}
          className="group relative w-full mb-8"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          
          <div className="relative flex items-center bg-[#131825] border border-[#1E293B] rounded-[20px] p-2 shadow-2xl transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <div className="pl-4 pr-2 text-slate-500">
              <Sparkles className="w-5 h-5 opacity-50 group-focus-within:text-blue-400 group-focus-within:opacity-100 transition-colors" />
            </div>
            
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.home.placeholder}
              className="w-full bg-transparent border-none outline-none py-3 text-lg text-slate-100 placeholder:text-slate-600"
            />

            <div className="flex items-center gap-1.5 pr-2">
              <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all active:scale-95">
                <Paperclip className="w-5 h-5" />
              </button>
              <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all active:scale-95">
                <Mic className="w-5 h-5" />
              </button>
              <button className={cn(
                "p-2.5 rounded-xl transition-all duration-300 active:scale-90",
                inputValue.length > 0 
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                  : "bg-slate-800/50 text-slate-500"
              )}>
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* SUGGESTION PILLS */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-3"
        >
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => setInputValue(item.text)}
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#131825] border border-[#1E293B] hover:border-slate-600 hover:bg-[#1c2436] transition-all duration-200 text-sm text-slate-400 hover:text-slate-200 shadow-sm hover:shadow-md"
            >
              <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </span>
              <span className="font-medium">{item.text}</span>
            </button>
          ))}
        </motion.div>

      </motion.div>

      {/* FOOTER HINT */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-[11px] font-medium tracking-widest text-slate-600 uppercase flex items-center gap-4"
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
