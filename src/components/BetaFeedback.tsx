"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareWarning, X, Upload, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FeedbackType = 'bug' | 'improvement' | 'suggestion';

interface BetaFeedbackProps {
  /** Currently active agent id (if in a chat context) */
  currentAgentId?: string;
  /** Currently active agent name (for display in dropdown) */
  currentAgentName?: string;
}

/**
 * BetaFeedback — Floating feedback button + modal for beta testers.
 * 
 * ISOLATED COMPONENT — no deep dependencies.
 * To remove after beta: delete this file + remove <BetaFeedback /> from layout.
 */
export default function BetaFeedback({ currentAgentId, currentAgentName }: BetaFeedbackProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setFeedbackType('bug');
    setDescription('');
    setScreenshot(null);
    setScreenshotName('');
    setSent(false);
    setError(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset after animation
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      setScreenshotName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);
    setError(false);

    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    try {
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: user?.id || 'anonymous',
        type: feedbackType,
        description: description.trim(),
        page_url: pageUrl,
        agent_id: currentAgentId || null,
        screenshot_url: screenshot || null,
        status: 'new',
      });

      if (insertError) {
        console.error('Feedback insert error:', insertError);
        // Still show success to user (we'll also try the edge function fallback)
      }

      // Try to send email notification via edge function
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          await fetch(`${supabaseUrl}/functions/v1/feedback-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: feedbackType,
              description: description.trim(),
              page_url: pageUrl,
              agent_id: currentAgentId || null,
              agent_name: currentAgentName || null,
              user_email: user?.email || 'anonymous',
            }),
          });
        }
      } catch {
        // Email notification is best-effort
      }

      setSent(true);
      setTimeout(handleClose, 2000);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const typeOptions: { value: FeedbackType; label: string; color: string }[] = [
    { value: 'bug', label: t.feedback.typeBug, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
    { value: 'improvement', label: t.feedback.typeImprovement, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    { value: 'suggestion', label: t.feedback.typeSuggestion, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#131825] border border-slate-700/60 rounded-full shadow-2xl shadow-black/40 hover:border-blue-500/40 hover:shadow-blue-900/20 transition-all group"
      >
        <MessageSquareWarning className="w-4.5 h-4.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors hidden sm:inline">
          {t.feedback.report}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {t.feedback.beta}
        </span>
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0F1320] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-semibold text-white">{t.feedback.title}</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Success state */}
              {sent ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="text-emerald-400 font-medium">{t.feedback.success}</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-5">
                  {/* Type selector */}
                  <div className="flex gap-2">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFeedbackType(opt.value)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                          feedbackType === opt.value
                            ? opt.color
                            : "text-slate-500 border-slate-800 bg-slate-900/30 hover:border-slate-700"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {t.feedback.descriptionLabel} *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.feedback.descriptionPlaceholder}
                      rows={4}
                      className="w-full bg-[#131825] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
                    />
                  </div>

                  {/* Screenshot upload */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {t.feedback.screenshotLabel}
                    </label>
                    {screenshot ? (
                      <div className="relative group">
                        <img
                          src={screenshot}
                          alt="Screenshot"
                          className="w-full max-h-32 object-cover rounded-xl border border-slate-800"
                        />
                        <button
                          onClick={() => { setScreenshot(null); setScreenshotName(''); }}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-slate-300">
                          {screenshotName}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border border-dashed border-slate-700 rounded-xl text-sm text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {t.feedback.screenshotUpload}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotChange}
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <p className="text-red-400 text-xs">{t.feedback.error}</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!description.trim() || sending}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                      description.trim() && !sending
                        ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                    )}
                  >
                    {sending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.feedback.sending}
                      </span>
                    ) : (
                      t.feedback.send
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
