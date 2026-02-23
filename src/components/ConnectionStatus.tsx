"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ConnectionStatus() {
  const { t } = useI18n();
  const { status, gatewayUrl, connect, disconnect } = useGateway();
  const [showModal, setShowModal] = useState(false);
  const [modalUrl, setModalUrl] = useState('');
  const [modalToken, setModalToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openModal = () => {
    setModalUrl(gatewayUrl || 'ws://localhost:18789');
    setModalToken('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await connect(modalUrl, modalToken);
      setShowModal(false);
    } catch {
      // Status listener handles error display
    } finally {
      setIsSaving(false);
    }
  };

  const statusColor = status === 'connected'
    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
    : status === 'connecting'
      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
      : 'bg-red-500/60';

  const statusLabel = status === 'connected'
    ? t.gateway.connected
    : status === 'connecting'
      ? t.gateway.connecting
      : t.gateway.disconnected;

  const StatusIcon = status === 'connected'
    ? Wifi
    : status === 'connecting'
      ? Loader2
      : WifiOff;

  return (
    <>
      {/* Compact indicator */}
      <button
        onClick={openModal}
        className="group flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all"
        title={t.gateway.statusTooltip.replace('{url}', gatewayUrl || '—')}
      >
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColor)} />
        <StatusIcon className={cn("w-3 h-3", status === 'connecting' && "animate-spin")} />
        <span className="hidden sm:inline">{statusLabel}</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#131825] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t.gateway.modalTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.gateway.modalDesc}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Status indicator */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0B0F1A] border border-slate-800/50">
                  <div className={cn("w-3 h-3 rounded-full flex-shrink-0", statusColor)} />
                  <span className="text-sm text-slate-300">{statusLabel}</span>
                  {status === 'connected' && (
                    <button
                      onClick={() => { disconnect(); }}
                      className="ml-auto text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      {t.gateway.disconnected === statusLabel ? '' : 'Disconnect'}
                    </button>
                  )}
                </div>

                {/* URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    {t.gateway.url}
                  </label>
                  <input
                    type="text"
                    value={modalUrl}
                    onChange={(e) => setModalUrl(e.target.value)}
                    placeholder={t.gateway.urlPlaceholder}
                    className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                {/* Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    {t.gateway.token}
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={modalToken}
                      onChange={(e) => setModalToken(e.target.value)}
                      placeholder={t.gateway.tokenPlaceholder}
                      className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-[#1E293B]">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 border border-slate-800 transition-all"
                >
                  {t.gateway.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!modalUrl || isSaving}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    !modalUrl || isSaving
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                  )}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t.gateway.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
