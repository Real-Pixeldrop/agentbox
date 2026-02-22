"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Mail,
  Send,
  Hash,
  Smartphone,
  Radio,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  QrCode,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChannelConfigProps {
  agentChannels?: string[];
}

interface ChannelState {
  enabled: boolean;
  expanded: boolean;
  config: Record<string, string>;
}

const CHANNEL_DEFS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageSquare,
    color: '#25D366',
    fields: ['phoneNumber'],
  },
  {
    id: 'email',
    name: 'Email (IMAP/SMTP)',
    icon: Mail,
    color: '#EA4335',
    fields: ['emailAddress', 'imapServer', 'smtpServer'],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    color: '#0088CC',
    fields: ['botToken'],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Hash,
    color: '#5865F2',
    fields: ['webhookUrl'],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: Hash,
    color: '#E01E5A',
    fields: ['workspaceToken'],
  },
  {
    id: 'signal',
    name: 'Signal',
    icon: Radio,
    color: '#3A76F0',
    fields: ['phoneNumber'],
  },
  {
    id: 'imessage',
    name: 'iMessage',
    icon: Smartphone,
    color: '#34C759',
    fields: [],
    premium: true,
  },
];

export default function ChannelConfig({ agentChannels = [] }: ChannelConfigProps) {
  const { t } = useI18n();

  const initialState: Record<string, ChannelState> = {};
  CHANNEL_DEFS.forEach((ch) => {
    initialState[ch.id] = {
      enabled: agentChannels.includes(ch.name.split(' ')[0]),
      expanded: false,
      config: {},
    };
  });

  const [channels, setChannels] = useState(initialState);

  const toggleEnabled = (id: string) => {
    setChannels((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const toggleExpanded = (id: string) => {
    setChannels((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  };

  const updateConfig = (id: string, field: string, value: string) => {
    setChannels((prev) => ({
      ...prev,
      [id]: { ...prev[id], config: { ...prev[id].config, [field]: value } },
    }));
  };

  const getFieldLabel = (field: string): string => {
    const key = field as keyof typeof t.channelConfig;
    return (t.channelConfig[key] as string) || field;
  };

  const getFieldPlaceholder = (field: string): string => {
    const placeholderKey = `${field}Placeholder` as keyof typeof t.channelConfig;
    return (t.channelConfig[placeholderKey] as string) || '';
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-1">{t.channelConfig.title}</h2>
        <p className="text-sm text-slate-400">{t.channelConfig.subtitle}</p>
      </div>

      <div className="space-y-3">
        {CHANNEL_DEFS.map((channelDef) => {
          const state = channels[channelDef.id];
          const isPremium = channelDef.premium;

          return (
            <div
              key={channelDef.id}
              className={cn(
                "bg-[#131825] border rounded-xl overflow-hidden transition-all",
                state.enabled ? "border-slate-700/50" : "border-slate-800/50"
              )}
            >
              {/* Channel Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => !isPremium && toggleExpanded(channelDef.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="p-2.5 rounded-xl transition-colors"
                    style={{
                      backgroundColor: state.enabled ? `${channelDef.color}15` : '#1E293B',
                      color: state.enabled ? channelDef.color : '#64748b',
                    }}
                  >
                    <channelDef.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-2">
                      {channelDef.name}
                      {isPremium && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold tracking-tight uppercase">
                          Premium
                        </span>
                      )}
                      {state.enabled && !isPremium && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPremium
                        ? t.channelConfig.premiumOnly
                        : state.enabled
                          ? t.channelConfig.enabled
                          : t.channelConfig.disabled}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isPremium && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEnabled(channelDef.id);
                      }}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-all duration-300",
                        state.enabled ? "bg-blue-600" : "bg-slate-700"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300",
                          state.enabled ? "left-5.5" : "left-0.5"
                        )}
                        style={{ left: state.enabled ? '22px' : '2px' }}
                      />
                    </button>
                  )}
                  {isPremium ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : (
                    state.expanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )
                  )}
                </div>
              </div>

              {/* Expanded Config */}
              <AnimatePresence>
                {state.expanded && !isPremium && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/50">
                      {channelDef.id === 'whatsapp' && (
                        <div className="flex items-center gap-4 mb-4 p-4 bg-[#0B0F1A] rounded-lg border border-slate-800/50">
                          <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                            <QrCode className="w-12 h-12 text-slate-600" />
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {t.channelConfig.qrCodePlaceholder}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        {channelDef.fields.map((field) => (
                          <div key={field} className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                              {getFieldLabel(field)}
                            </label>
                            <input
                              type="text"
                              value={state.config[field] || ''}
                              onChange={(e) => updateConfig(channelDef.id, field, e.target.value)}
                              placeholder={getFieldPlaceholder(field)}
                              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                            />
                          </div>
                        ))}
                      </div>

                      <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all">
                        {t.channelConfig.save}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
