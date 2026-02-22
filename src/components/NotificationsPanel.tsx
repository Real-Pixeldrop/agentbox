"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Mail,
  Bell,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Notification {
  id: string;
  type: 'task' | 'email' | 'reminder' | 'error';
  agentName: string;
  agentPhoto: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  task: { icon: CheckCircle2, color: 'text-emerald-400' },
  email: { icon: Mail, color: 'text-blue-400' },
  reminder: { icon: Bell, color: 'text-amber-400' },
  error: { icon: AlertTriangle, color: 'text-red-400' },
};

export default function NotificationsPanel({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClose,
}: NotificationsPanelProps) {
  const { t } = useI18n();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 w-96 bg-[#131825] border border-slate-800 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">{t.notifications.title}</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                {t.notifications.markAllRead}
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const config = TYPE_ICON[notif.type];
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 cursor-pointer transition-colors",
                    notif.read
                      ? "opacity-60 hover:opacity-80"
                      : "bg-blue-500/5 hover:bg-blue-500/10"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={notif.agentPhoto}
                      alt={notif.agentName}
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                    />
                    <div className={cn("absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#131825]", config.color)}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-semibold text-white">{notif.agentName}</span>{' '}
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{notif.time}</span>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">{t.notifications.noNotifications}</p>
              <p className="text-xs text-slate-600 mt-1">{t.notifications.noNotificationsDesc}</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
