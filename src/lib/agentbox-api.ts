/**
 * AgentBox API Client
 * Communicates with the VPS API (gateway.pixel-drop.com/api/)
 */

const API_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace('wss://', 'https://').replace('ws://', 'http://') || 'https://gateway.pixel-drop.com';

export interface WorkspaceInfo {
  userId: string;
  path: string;
  totalSize: number;
  fileCount: number;
  maxSize: number;
  createdAt: string;
}

export interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
}

export interface SandboxResult {
  ok: boolean;
  execId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  outputFiles: Array<{
    name: string;
    size: number;
    downloadUrl: string;
  }>;
}

export interface CredentialInfo {
  type: string;
  set: boolean;
  updatedAt: string | null;
}

/**
 * Get auth headers from Supabase session
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  // Try to get token from Supabase
  const { supabase } = await import('./supabase');
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  throw new Error('Not authenticated');
}

/**
 * Safely parse a fetch response as JSON.
 * Throws a user-friendly error when the response isn't valid JSON
 * (e.g. the gateway returns an HTML page).
 */
async function safeJsonParse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  // If the content-type is clearly not JSON, don't even try to parse
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trimStart().startsWith('<')) {
      throw new Error('GATEWAY_NOT_CONNECTED');
    }
    // Might still be JSON without proper content-type header
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('GATEWAY_NOT_CONNECTED');
    }
  }

  // Content-type says JSON — try to parse
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.trimStart().startsWith('<')) {
      throw new Error('GATEWAY_NOT_CONNECTED');
    }
    throw new Error('ENDPOINT_UNAVAILABLE');
  }
}

/**
 * Workspace API
 */
export async function getWorkspaceInfo(): Promise<WorkspaceInfo> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/workspace`, { headers });
  const data = await safeJsonParse<{ ok: boolean; error?: string; workspace: WorkspaceInfo }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to get workspace info');
  return data.workspace;
}

export async function listFiles(dirPath = ''): Promise<{ path: string; files: FileEntry[] }> {
  const headers = await getAuthHeaders();
  const url = dirPath 
    ? `${API_BASE}/api/files?path=${encodeURIComponent(dirPath)}`
    : `${API_BASE}/api/files`;
  const res = await fetch(url, { headers });
  const data = await safeJsonParse<{ ok: boolean; error?: string; path: string; files: FileEntry[] }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to list files');
  return { path: data.path, files: data.files };
}

export async function readFile(filePath: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/files?path=${encodeURIComponent(filePath)}`, { headers });
  const data = await safeJsonParse<{ ok: boolean; error?: string; content: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to read file');
  return data.content;
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/files`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ path: filePath, content }),
  });
  const data = await safeJsonParse<{ ok: boolean; error?: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to write file');
}

export async function deleteFile(filePath: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/files`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ path: filePath }),
  });
  const data = await safeJsonParse<{ ok: boolean; error?: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to delete file');
}

/**
 * Sandbox API
 */
export async function runCode(language: string, code: string): Promise<SandboxResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/sandbox/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ language, code }),
  });
  const data = await safeJsonParse<SandboxResult & { ok: boolean; error?: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Sandbox execution failed');
  return data;
}

/**
 * Credentials API
 */
export async function getCredentials(): Promise<Record<string, CredentialInfo>> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credentials`, { headers });
  const data = await safeJsonParse<{ ok: boolean; error?: string; credentials: Record<string, CredentialInfo> }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to get credentials');
  return data.credentials;
}

export async function setCredential(key: string, value: string, type = 'api_key'): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credentials`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ key, value, type }),
  });
  const data = await safeJsonParse<{ ok: boolean; error?: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to save credential');
}

export async function deleteCredential(key: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credentials`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ key }),
  });
  const data = await safeJsonParse<{ ok: boolean; error?: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to delete credential');
}

/**
 * Download URL generation
 */
export async function generateDownloadUrl(filePath: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/download-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filePath }),
  });
  const data = await safeJsonParse<{ ok: boolean; error?: string; url: string }>(res);
  if (!data.ok) throw new Error(data.error || 'Failed to generate download URL');
  return data.url;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
