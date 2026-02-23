"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Settings,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Coins,
  AlertTriangle,
  X,
  ImageIcon,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import type { GatewayEvent } from '@/lib/gateway';
import { useAuth } from '@/lib/AuthContext';
import { uploadAttachment } from '@/lib/storage';
import AgentSettingsPanel from './AgentSettingsPanel';
import AgentAvatar from './AgentAvatar';
import { useAgentFiles } from '@/lib/useAgentFiles';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract text from gateway message content.
 * Content can be a string, an array of content blocks [{type: "text", text: "..."}],
 * or an object with a text property.
 */
function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'text' in block && typeof block.text === 'string') {
          return block.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (content && typeof content === 'object' && 'text' in content && typeof (content as Record<string, unknown>).text === 'string') {
    return (content as Record<string, unknown>).text as string;
  }
  return String(content ?? '');
}

interface AgentConversationProps {
  agent: {
    id: number;
    name: string;
    role: string;
    photo: string;
    active: boolean;
    channels: string[];
    schedule: string;
  };
  /** Session key for gateway communication */
  sessionKey: string;
  onBack: () => void;
  onOpenSettings?: () => void;
  /** Supabase agent UUID — for file sync between chat and settings */
  supabaseAgentId?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
  image?: string;
}

// Mock messages - only shown in demo mode (disconnected)
const DEMO_MESSAGES: ChatMessage[] = [
  { id: 'm1', sender: 'agent', text: "Hello! I'm ready and operational. I've processed 12 emails this morning and updated the CRM pipeline.", time: '09:00' },
  { id: 'm2', sender: 'user', text: "Great. What's the status on the Simon invoice follow-up?", time: '09:05' },
  { id: 'm3', sender: 'agent', text: "I sent a follow-up to Simon R. yesterday at 14:05. He acknowledged receipt. The invoice is due in 3 days. I'll send a final reminder 24h before.", time: '09:05' },
  { id: 'm4', sender: 'user', text: 'Perfect. Any urgent items?', time: '09:12' },
  { id: 'm5', sender: 'agent', text: "Two items need your attention:\n\n1. Client X meeting tomorrow at 10h — I've prepared a brief in your Desktop folder.\n2. New lead from the website form — looks like a good fit for the SaaS package. Want me to qualify them?", time: '09:12' },
  { id: 'm6', sender: 'user', text: 'Yes, qualify the lead and send me a summary.', time: '09:15' },
  { id: 'm7', sender: 'agent', text: "On it. I'll research the company, check LinkedIn profiles, and prepare a qualification summary. ETA: 15 minutes.", time: '09:15' },
];

export default function AgentConversation({ agent, sessionKey, onBack, onOpenSettings, supabaseAgentId }: AgentConversationProps) {
  const { t } = useI18n();
  const { isConnected, send, onEvent } = useGateway();
  const { user } = useAuth();
  const agentFiles = useAgentFiles(supabaseAgentId, sessionKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Load history on mount or when sessionKey changes
  useEffect(() => {
    setMessages([]);
    setHistoryLoaded(false);
    setStreamingText('');
    setIsTyping(false);

    if (isConnected) {
      // Live mode: load real history from gateway, start with empty chat
      loadHistory();
    } else {
      // Demo mode: show mock messages
      setMessages(DEMO_MESSAGES);
      setHistoryLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, sessionKey]);

  // Check for initial message from Home page
  useEffect(() => {
    if (!historyLoaded) return;
    const initialMessage = sessionStorage.getItem('agentbox_initial_message');
    if (initialMessage) {
      sessionStorage.removeItem('agentbox_initial_message');
      // Auto-send the message
      const userMsg: ChatMessage = {
        id: `m${Date.now()}`,
        sender: 'user',
        text: initialMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setStreamingText('');

      if (isConnected) {
        send('chat.send', { message: initialMessage, sessionKey, idempotencyKey: crypto.randomUUID() }).catch(() => {
          setIsTyping(false);
          const errorMsg: ChatMessage = {
            id: `m${Date.now() + 1}`,
            sender: 'agent',
            text: "⚠️ Failed to send message. Please check the gateway connection.",
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          };
          setMessages((prev) => [...prev, errorMsg]);
        });
      } else {
        setTimeout(() => {
          const agentMsg: ChatMessage = {
            id: `m${Date.now() + 1}`,
            sender: 'agent',
            text: "Understood. I'll take care of it right away and update you once it's done.",
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          };
          setMessages((prev) => [...prev, agentMsg]);
          setIsTyping(false);
        }, 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoaded]);

  // Listen for streaming events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onEvent((event: GatewayEvent) => {
      handleStreamEvent(event);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, onEvent, sessionKey]);

  const loadHistory = useCallback(async () => {
    try {
      const result = await send<{ messages?: Array<{ role: string; content: unknown; timestamp?: string }> }>('chat.history', {
        sessionKey,
      });
      if (result?.messages && result.messages.length > 0) {
        const parsed: ChatMessage[] = result.messages.map((msg, i) => ({
          id: `h${i}`,
          sender: msg.role === 'user' ? 'user' as const : 'agent' as const,
          text: extractText(msg.content),
          time: msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
            : '',
        }));
        setMessages(parsed);
      }
      // If no messages, that's fine — start with empty chat
    } catch {
      // Gateway error — start with empty chat
    }
    setHistoryLoaded(true);
  }, [send, sessionKey]);

  const handleStreamEvent = useCallback((event: GatewayEvent) => {
    const { type, data } = event;

    const eventSessionKey = data.sessionKey as string | undefined;

    // Only process events for our current session
    if (eventSessionKey && eventSessionKey !== sessionKey && !eventSessionKey.startsWith(sessionKey)) return;

    // Sync file changes from gateway to Supabase
    // The gateway may emit file-change events when the agent writes files during chat
    if (type === 'agent') {
      const stream = data.stream as string | undefined;
      const agentData = data.data as Record<string, unknown> | undefined;
      if (stream === 'file_write' && agentData) {
        const filePath = agentData.path as string | undefined;
        const content = agentData.content as string | undefined;
        if (filePath && content !== undefined) {
          agentFiles.syncFileToVps(filePath, content).catch(() => {
            // Best-effort sync, don't interrupt chat
          });
        }
      }
    }

    // Gateway sends two event types for streaming:
    // 1. "agent" events with stream="assistant" → contains data.delta (incremental text)
    // 2. "chat" events with state="delta"|"final" → contains message.content (full text so far)
    // We use "agent" events for real-time streaming (delta by delta) and "chat" state="final" to finalize.

    if (type === 'agent') {
      const stream = data.stream as string | undefined;
      const agentData = data.data as Record<string, unknown> | undefined;

      if (stream === 'assistant' && agentData) {
        const delta = agentData.delta as string | undefined;
        if (delta) {
          setIsTyping(true);
          setStreamingText((prev) => prev + delta);
        }
      }

      if (stream === 'lifecycle' && agentData) {
        const phase = agentData.phase as string | undefined;
        if (phase === 'error') {
          setIsTyping(false);
          setStreamingText('');
          const errorText = (agentData.error as string) || 'Unknown error';
          const errorMsg: ChatMessage = {
            id: `m${Date.now()}`,
            sender: 'agent',
            text: `⚠️ ${errorText}`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          };
          setMessages((msgs) => [...msgs, errorMsg]);
        }
      }
      return;
    }

    if (type === 'chat') {
      const state = data.state as string | undefined;

      if (state === 'final') {
        // Extract text from message.content array [{type: "text", text: "..."}]
        const message = data.message as Record<string, unknown> | undefined;
        const finalText = message ? extractText(message.content) : '';

        setStreamingText((prevStreamed) => {
          const msgText = finalText || prevStreamed;
          if (msgText) {
            const finalMsg: ChatMessage = {
              id: `m${Date.now()}`,
              sender: 'agent',
              text: msgText,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            };
            setMessages((msgs) => [...msgs, finalMsg]);
          }
          return '';
        });
        setIsTyping(false);
      }

      if (state === 'error') {
        setIsTyping(false);
        setStreamingText('');
        const errorText = typeof data.error === 'string' ? data.error : 'Unknown error';
        const errorMsg: ChatMessage = {
          id: `m${Date.now()}`,
          sender: 'agent',
          text: `⚠️ ${errorText}`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
        setMessages((msgs) => [...msgs, errorMsg]);
      }
    }
  }, [sessionKey, agentFiles]);

  // Image attachment handlers
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setAttachedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
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
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !attachedImage) return;

    const messageText = inputValue.trim();
    const imagePreview = attachedImage;
    const fileToUpload = attachedFile;

    // Upload image to Supabase Storage if present
    let imageUrl: string | null = null;
    if (fileToUpload && user?.id) {
      setIsUploading(true);
      imageUrl = await uploadAttachment(fileToUpload, user.id);
      setIsUploading(false);
    }

    const displayText = imagePreview && messageText
      ? messageText
      : imagePreview
        ? `[${t.attachments.attachedImage}]`
        : messageText;

    const userMsg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'user',
      text: displayText,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      image: imageUrl || imagePreview || undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setAttachedImage(null);
    setAttachedFile(null);
    setIsTyping(true);
    setStreamingText('');

    if (isConnected) {
      // Live mode: send via gateway with sessionKey
      try {
        await send('chat.send', { message: messageText, sessionKey, idempotencyKey: crypto.randomUUID() });
      } catch {
        setIsTyping(false);
        const errorMsg: ChatMessage = {
          id: `m${Date.now() + 1}`,
          sender: 'agent',
          text: "⚠️ Failed to send message. Please check the gateway connection.",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } else {
      // Demo mode: mock response
      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: `m${Date.now() + 1}`,
          sender: 'agent',
          text: "Understood. I'll take care of it right away and update you once it's done.",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0F1A]">
      {/* Demo mode banner */}
      {!isConnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-medium">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.conversation.demoBanner}
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-3">
            <AgentAvatar
              name={agent.name}
              photo={agent.photo}
              size="sm"
              active={agent.active}
              showStatus
            />
            <div>
              <h2 className="text-sm font-semibold text-white">{agent.name}</h2>
              <p className="text-[11px] text-slate-500">
                {agent.active ? t.conversation.online : t.conversation.offline}
                <span className="mx-1.5 text-slate-700">·</span>
                {agent.role}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cost info */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131825] border border-slate-800 mr-2">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400 font-medium">1.2k {t.agents.tokensToday} · $0.03 {t.agents.today}</span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title={t.conversation.agentSettings}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <AgentSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        agent={agent}
        sessionKey={sessionKey}
        supabaseAgentId={supabaseAgentId}
      />

      {/* Chat Content */}
      {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {!historyLoaded && isConnected && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  {t.conversation.loadingHistory}
                </div>
              </div>
            )}

            {/* Welcome message for empty conversation */}
            {historyLoaded && messages.length === 0 && isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-end gap-2"
              >
                <AgentAvatar name={agent.name} photo={agent.photo} size="xs" />
                <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3 max-w-[70%]">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {(() => {
                      const userName = user?.user_metadata?.full_name?.split(' ')[0] || '';
                      const template = userName
                        ? t.conversation.welcomeMessage
                        : t.conversation.welcomeMessageNoName;
                      return template
                        .replace('{name}', userName)
                        .replace('{agent}', agent.name)
                        .replace('{role}', agent.role);
                    })()}
                  </p>
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex",
                    msg.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "flex items-end gap-2 max-w-[70%]",
                    msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    {msg.sender === 'agent' && (
                      <AgentAvatar name={agent.name} photo={agent.photo} size="xs" />
                    )}
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      msg.sender === 'user'
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-[#1E293B] text-slate-200 rounded-bl-md border border-slate-700/50"
                    )}>
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt={t.attachments.attachedImage}
                          className="max-w-full max-h-48 rounded-lg mb-2 object-cover"
                        />
                      )}
                      {msg.text}
                      <div className={cn(
                        "text-[10px] mt-1.5",
                        msg.sender === 'user' ? "text-blue-200/60 text-right" : "text-slate-500"
                      )}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming text (in-progress response) */}
            {streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2"
              >
                <AgentAvatar name={agent.name} photo={agent.photo} size="xs" />
                <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3 max-w-[70%]">
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{streamingText}</p>
                </div>
              </motion.div>
            )}

            {/* Typing indicator */}
            {isTyping && !streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2"
              >
                <AgentAvatar name={agent.name} photo={agent.photo} size="xs" />
                <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">{t.conversation.thinking}</span>
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* AI Disclaimer */}
          <div className="text-center py-1.5">
            <p className="text-[10px] text-slate-600">{t.disclaimer.text}</p>
          </div>

          {/* Input */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative border-t border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md p-4"
          >
            {/* Drag overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-blue-600/10 border-2 border-dashed border-blue-500/50 rounded-xl backdrop-blur-sm"
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
                  className="mb-3 overflow-hidden"
                >
                  <div className="relative inline-block">
                    <img
                      src={attachedImage}
                      alt={t.attachments.attachedImage}
                      className="max-h-20 rounded-lg border border-slate-700"
                    />
                    <button
                      onClick={() => { setAttachedImage(null); setAttachedFile(null); }}
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

            <div className="flex items-center gap-3 bg-[#131825] border border-slate-800 rounded-xl px-4 py-2 focus-within:border-blue-500/50 transition-colors">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-500 hover:text-white transition-colors"
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
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={t.conversation.typeMessage}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600"
              />
              <button
                onClick={handleSend}
                disabled={(!inputValue.trim() && !attachedImage) || isUploading}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  (inputValue.trim() || attachedImage) && !isUploading
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                    : "bg-slate-800 text-slate-600"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
    </div>
  );
}
