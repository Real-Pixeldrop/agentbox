"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  GatewayClient,
  type ConnectionStatus,
  type GatewayEvent,
} from './gateway';

interface GatewayContextType {
  /** Current connection status */
  status: ConnectionStatus;
  /** The gateway client instance */
  client: GatewayClient;
  /** Whether gateway is fully connected */
  isConnected: boolean;
  /** Connect to a gateway */
  connect: (url: string, token: string) => Promise<void>;
  /** Disconnect from the gateway */
  disconnect: () => void;
  /** Send an RPC call */
  send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
  /** Register a streaming event listener. Returns unsubscribe fn. */
  onEvent: (callback: (event: GatewayEvent) => void) => () => void;
  /** Gateway URL (for display) */
  gatewayUrl: string;
}

const GatewayContext = createContext<GatewayContextType | null>(null);

const STORAGE_KEY_URL = 'agentbox_gateway_url';
const STORAGE_KEY_TOKEN = 'agentbox_gateway_token';

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<GatewayClient>(new GatewayClient());
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [gatewayUrl, setGatewayUrl] = useState<string>('');

  // Sync status from client
  useEffect(() => {
    const client = clientRef.current;
    const unsubscribe = client.onStatusChange((s) => setStatus(s));
    return () => { unsubscribe(); };
  }, []);

  // Auto-connect on mount from env vars or localStorage
  useEffect(() => {
    const stored = loadConfig();
    const url = stored.url || process.env.NEXT_PUBLIC_GATEWAY_URL || 'ws://localhost:18789';
    const token = stored.token || process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';

    if (url) {
      setGatewayUrl(url);
      clientRef.current.connect(url, token).catch(() => {
        // silent - status listener handles the UI
      });
    }
  }, []);

  const connect = useCallback(async (url: string, token: string) => {
    setGatewayUrl(url);
    saveConfig(url, token);
    await clientRef.current.connect(url, token);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current.disconnect();
  }, []);

  const send = useCallback(<T = unknown,>(method: string, params: Record<string, unknown> = {}): Promise<T> => {
    return clientRef.current.send<T>(method, params);
  }, []);

  const onEvent = useCallback((callback: (event: GatewayEvent) => void) => {
    return clientRef.current.onEvent(callback);
  }, []);

  const value: GatewayContextType = {
    status,
    client: clientRef.current,
    isConnected: status === 'connected',
    connect,
    disconnect,
    send,
    onEvent,
    gatewayUrl,
  };

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway(): GatewayContextType {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error('useGateway must be used within GatewayProvider');
  return ctx;
}

// --- localStorage helpers ---

function loadConfig(): { url: string; token: string } {
  if (typeof window === 'undefined') return { url: '', token: '' };
  try {
    return {
      url: localStorage.getItem(STORAGE_KEY_URL) || '',
      token: localStorage.getItem(STORAGE_KEY_TOKEN) || '',
    };
  } catch {
    return { url: '', token: '' };
  }
}

function saveConfig(url: string, token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_URL, url);
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  } catch {
    // silently fail
  }
}
