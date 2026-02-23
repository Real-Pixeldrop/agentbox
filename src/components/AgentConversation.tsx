"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Settings,
  Radio,
  MessageSquare,
  Paperclip,
  Mic,
  MoreVertical,
  Coins,
  AlertTriangle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import type { GatewayEvent } from '@/lib/gateway';
import ChannelConfig from './ChannelConfig';

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
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
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

export default function AgentConversation({ agent, sessionKey, onBack, onOpenSettings }: AgentConversationProps) {
  const { t } = useI18n();
  const { isConnected, send, onEvent } = useGateway();
  const [activeTab, setActiveTab] = useState<'chat' | 'channels'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Debug: log all gateway events to diagnose streaming issues
    console.log('[stream]', type, data);

    // Only handle "chat" events
    if (type !== 'chat') return;

    const kind = data.kind as string | undefined;
    const eventSessionKey = data.sessionKey as string | undefined;

    // Only process events for our current session
    // Use startsWith for flexible matching (e.g. "agent:my-agent:main" vs "agent:my-agent:main:sub")
    if (eventSessionKey && eventSessionKey !== sessionKey && !eventSessionKey.startsWith(sessionKey)) return;

    switch (kind) {
      case 'chunk': {
        // data.text can be a plain string (most common for chunks), an object {type: "text", text: "..."},
        // or an array of content blocks. Handle all cases.
        const rawText = data.text;
        let text = '';
        if (typeof rawText === 'string') {
          text = rawText;
        } else if (rawText && typeof rawText === 'object' && 'text' in rawText && typeof (rawText as Record<string, unknown>).text === 'string') {
          text = (rawText as Record<string, unknown>).text as string;
        } else if (Array.isArray(rawText)) {
          text = extractText(rawText);
        } else if (rawText !== undefined && rawText !== null) {
          // Last resort: try extractText which handles all cases
          text = extractText(rawText);
        }
        if (text) {
          setIsTyping(true);
          setStreamingText((prev) => prev + text);
        }
        break;
      }
      case 'final': {
        // Finalize the streaming message with the full response text
        // Use the final text if provided, otherwise use whatever was streamed
        const finalText = extractText(data.text ?? '');

        setStreamingText((prevStreamed) => {
          // Use final text if available, otherwise fall back to accumulated streamed text
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
          return ''; // Clear streaming text
        });
        setIsTyping(false);
        break;
      }
      case 'error': {
        setIsTyping(false);
        setStreamingText('');
        const errorText = typeof data.error === 'string' ? data.error : typeof data.text === 'string' ? data.text : 'Unknown error';
        const errorMsg: ChatMessage = {
          id: `m${Date.now()}`,
          sender: 'agent',
          text: `⚠️ ${errorText}`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
        setMessages((msgs) => [...msgs, errorMsg]);
        break;
      }
    }
  }, [sessionKey]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'user',
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setMessages((prev) => [...prev, userMsg]);
    const messageText = inputValue.trim();
    setInputValue('');
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
            <div className="relative">
              <img
                src={agent.photo}
                alt={agent.name}
                className="w-9 h-9 rounded-full border-2 border-slate-700 object-cover"
              />
              {agent.active && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0B0F1A] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              )}
            </div>
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

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#131825] border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === 'chat'
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t.conversation.chat}
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === 'channels'
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Radio className="w-3.5 h-3.5" />
              {t.conversation.channels}
            </button>
          </div>

          <button
            onClick={onOpenSettings}
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

      {/* Content */}
      {activeTab === 'chat' ? (
        <>
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

            {/* Empty state for connected mode with no history */}
            {historyLoaded && messages.length === 0 && isConnected && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-[#131825] rounded-full flex items-center justify-center mb-4 border border-slate-800">
                  <MessageSquare className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm mb-1">No messages yet</p>
                <p className="text-slate-600 text-xs">Send a message to start the conversation</p>
              </div>
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
                      <img
                        src={agent.photo}
                        alt=""
                        className="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0"
                      />
                    )}
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      msg.sender === 'user'
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-[#1E293B] text-slate-200 rounded-bl-md border border-slate-700/50"
                    )}>
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
                <img
                  src={agent.photo}
                  alt=""
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                />
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
                <img
                  src={agent.photo}
                  alt=""
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                />
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

          {/* Input */}
          <div className="border-t border-slate-800/50 bg-[#0B0F1A]/80 backdrop-blur-md p-4">
            <div className="flex items-center gap-3 bg-[#131825] border border-slate-800 rounded-xl px-4 py-2 focus-within:border-blue-500/50 transition-colors">
              <button className="p-1.5 text-slate-500 hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.conversation.typeMessage}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600"
              />
              <button className="p-1.5 text-slate-500 hover:text-white transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  inputValue.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                    : "bg-slate-800 text-slate-600"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ChannelConfig agentChannels={agent.channels} />
        </div>
      )}
    </div>
  );
}
