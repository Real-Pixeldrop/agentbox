/**
 * GatewayClient - WebSocket client for the Clawdbot Gateway Protocol
 *
 * Protocol:
 *   - Requests:  {type: "req", id: string, method: string, params: object}
 *   - Responses: {type: "res", id: string, ok: boolean, payload?: any, error?: {message: string}}
 *   - Events:    {type: "event", event: string, payload?: any, seq?: number}
 *
 * Connection flow:
 *   1. Open WebSocket
 *   2. Receive connect.challenge event
 *   3. Send connect request with auth
 *   4. Receive connect response (hello) → connected
 */

type EventCallback = (event: GatewayEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface GatewayEvent {
  /** The event name (e.g. "chat") */
  type: string;
  /** Payload data */
  data: Record<string, unknown>;
  /** Session key if applicable */
  sessionKey?: string;
}

interface PendingRPC {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Generate a unique string ID for requests */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Random instanceId generated once per client lifetime */
const CLIENT_INSTANCE_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private pendingRpcs: Map<string, PendingRPC> = new Map();
  private eventListeners: Set<EventCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private _status: ConnectionStatus = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private shouldReconnect: boolean = false;
  private connectPromiseResolve: (() => void) | null = null;
  private connectPromiseReject: ((err: Error) => void) | null = null;

  /** The default session key received from the gateway or inferred */
  public sessionKey: string = 'agent:main:main';

  /** Snapshot received on connect */
  public snapshot: Record<string, unknown> | null = null;

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
        const wsUrl = url2ws(this.url);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          // Do NOT resolve here — wait for connect.challenge + hello response
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
   * Send a request and wait for the response.
   */
  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this._status !== 'connected') {
        reject(new Error('Not connected to gateway'));
        return;
      }

      const id = generateId();
      const message = JSON.stringify({
        type: 'req',
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

  /**
   * Send the connect (auth/hello) request after receiving connect.challenge.
   */
  private sendConnectRequest() {
    if (!this.ws) return;

    const id = generateId();
    const message = JSON.stringify({
      type: 'req',
      id,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'agentbox-webchat',
          version: '1.0.0',
          platform: 'web',
          mode: 'webchat',
          instanceId: CLIENT_INSTANCE_ID,
        },
        role: 'operator.admin',
        scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
        caps: [],
        auth: {
          token: this.token,
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'agentbox/1.0',
        locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
      },
    });

    // Register pending RPC for the connect response
    const timer = setTimeout(() => {
      this.pendingRpcs.delete(id);
      this.connectPromiseReject?.(new Error('Connect handshake timeout'));
      this.connectPromiseResolve = null;
      this.connectPromiseReject = null;
    }, 15000);

    this.pendingRpcs.set(id, {
      resolve: (result: unknown) => {
        // Hello response received — we are connected
        const payload = result as Record<string, unknown> | undefined;
        if (payload?.snapshot) {
          this.snapshot = payload.snapshot as Record<string, unknown>;
        }
        this.setStatus('connected');
        this.reconnectDelay = 1000;
        this.connectPromiseResolve?.();
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      },
      reject: (error: Error) => {
        this.connectPromiseReject?.(error);
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      },
      timer,
    });

    this.ws.send(message);
  }

  private handleMessage(raw: string | ArrayBuffer | Blob) {
    if (typeof raw !== 'string') return;

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    const msgType = msg.type as string | undefined;

    // Handle response messages: {type: "res", id, ok, payload, error}
    if (msgType === 'res' && typeof msg.id === 'string') {
      const pending = this.pendingRpcs.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRpcs.delete(msg.id);
        if (msg.ok) {
          pending.resolve(msg.payload);
        } else {
          const err = msg.error as { message?: string } | undefined;
          pending.reject(new Error(err?.message || 'RPC error'));
        }
      }
      return;
    }

    // Handle event messages: {type: "event", event, payload, seq}
    if (msgType === 'event') {
      const eventName = msg.event as string;
      const payload = (msg.payload || {}) as Record<string, unknown>;

      // Special handling: connect.challenge triggers the auth handshake
      if (eventName === 'connect.challenge') {
        this.sendConnectRequest();
        return;
      }

      // Convert to GatewayEvent and emit to listeners
      const event: GatewayEvent = {
        type: eventName,
        data: payload,
        sessionKey: payload.sessionKey as string | undefined,
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
  // Default to ws:// for localhost, wss:// otherwise
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return `ws://${url}`;
  }
  return `wss://${url}`;
}

/** Singleton instance */
export const gatewayClient = new GatewayClient();
