/**
 * GatewayClient - WebSocket client for the AgentBox Gateway (JSON-RPC 2.0)
 *
 * Handles connection, auto-reconnect, RPC calls, and streaming events.
 */

type EventCallback = (event: GatewayEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface GatewayEvent {
  /** The JSON-RPC method or notification type */
  type: string;
  /** Payload data */
  data: Record<string, unknown>;
  /** Run ID if applicable */
  runId?: string;
}

interface PendingRPC {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private rpcId: number = 0;
  private pendingRpcs: Map<number, PendingRPC> = new Map();
  private eventListeners: Set<EventCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private _status: ConnectionStatus = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private shouldReconnect: boolean = false;
  private connectPromiseResolve: (() => void) | null = null;
  private connectPromiseReject: ((err: Error) => void) | null = null;

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  /**
   * Connect to the gateway WebSocket.
   */
  connect(url: string, token: string): Promise<void> {
    // Prevent duplicate connections
    if (this.ws && (this._status === 'connected' || this._status === 'connecting')) {
      if (this.url === url && this.token === token) {
        return Promise.resolve();
      }
      this.disconnect();
    }

    this.url = url;
    this.token = token;
    this.shouldReconnect = true;
    this.reconnectDelay = 1000;

    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectPromiseResolve = resolve;
      this.connectPromiseReject = reject;

      this.setStatus('connecting');

      try {
        // Build URL with auth token in connect params
        const wsUrl = new URL(url2ws(this.url));
        wsUrl.searchParams.set('auth.token', this.token);

        this.ws = new WebSocket(wsUrl.toString());

        this.ws.onopen = () => {
          this.setStatus('connected');
          this.reconnectDelay = 1000;
          this.connectPromiseResolve?.();
          this.connectPromiseResolve = null;
          this.connectPromiseReject = null;
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

        this.ws.onerror = () => {
          // onclose will be called after onerror
        };
      } catch (err) {
        this.setStatus('disconnected');
        this.connectPromiseReject?.(err instanceof Error ? err : new Error(String(err)));
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      }
    });
  }

  /**
   * Disconnect from the gateway.
   */
  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
    // Reject all pending RPCs
    this.pendingRpcs.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(new Error('Disconnected'));
    });
    this.pendingRpcs.clear();
    this.setStatus('disconnected');
  }

  /**
   * Send a JSON-RPC call and wait for the response.
   */
  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this._status !== 'connected') {
        reject(new Error('Not connected to gateway'));
        return;
      }

      const id = ++this.rpcId;
      const message = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });

      const timer = setTimeout(() => {
        this.pendingRpcs.delete(id);
        reject(new Error(`RPC timeout: ${method}`));
      }, 30000);

      this.pendingRpcs.set(id, {
        resolve: resolve as (result: unknown) => void,
        reject,
        timer,
      });

      this.ws.send(message);
    });
  }

  /**
   * Register a listener for streaming events.
   */
  onEvent(callback: EventCallback): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  /**
   * Register a listener for connection status changes.
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private handleMessage(raw: string | ArrayBuffer | Blob) {
    if (typeof raw !== 'string') return;

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // JSON-RPC response (has id)
    if ('id' in msg && typeof msg.id === 'number') {
      const pending = this.pendingRpcs.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRpcs.delete(msg.id);
        if ('error' in msg && msg.error) {
          const err = msg.error as { message?: string; code?: number };
          pending.reject(new Error(err.message || 'RPC error'));
        } else {
          pending.resolve(msg.result);
        }
      }
      return;
    }

    // Streaming event / notification (no id)
    if ('method' in msg || 'type' in msg) {
      const event: GatewayEvent = {
        type: (msg.method || msg.type) as string,
        data: (msg.params || msg.data || msg) as Record<string, unknown>,
        runId: msg.runId as string | undefined,
      };
      this.eventListeners.forEach((cb) => cb(event));
    }
  }

  private handleDisconnect() {
    this.setStatus('disconnected');

    // Reject pending connect promise
    this.connectPromiseReject?.(new Error('Connection closed'));
    this.connectPromiseResolve = null;
    this.connectPromiseReject = null;

    // Reject all pending RPCs
    this.pendingRpcs.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(new Error('Connection lost'));
    });
    this.pendingRpcs.clear();

    // Auto-reconnect with exponential backoff
    if (this.shouldReconnect) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.doConnect().catch(() => {
          // doConnect failure is handled internally
        });
      }, this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }
  }
}

/** Convert http(s) URL to ws(s) URL */
function url2ws(url: string): string {
  if (url.startsWith('ws://') || url.startsWith('wss://')) return url;
  if (url.startsWith('https://')) return url.replace('https://', 'wss://');
  if (url.startsWith('http://')) return url.replace('http://', 'ws://');
  return `ws://${url}`;
}

/** Singleton instance */
export const gatewayClient = new GatewayClient();
