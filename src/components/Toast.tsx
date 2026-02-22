"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  description?: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, description, visible, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose, duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-[#131825] border border-emerald-500/30 rounded-xl px-5 py-4 shadow-2xl shadow-black/40"
        >
          <div className="p-1.5 rounded-full bg-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{message}</p>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="ml-2 p-1 text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
