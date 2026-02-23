/**
 * Agent Files API — HTTP client for the VPS REST API.
 *
 * Base URL:  NEXT_PUBLIC_AGENTBOX_API_URL  (default https://gateway.pixel-drop.com/agentbox)
 * Auth:      Bearer NEXT_PUBLIC_AGENTBOX_API_TOKEN
 *
 * Endpoints:
 *   GET    /agents/{id}/files              → list files
 *   GET    /agents/{id}/files?prefix=x/    → list with prefix filter
 *   GET    /agents/{id}/files/{path}       → read file
 *   PUT    /agents/{id}/files/{path}       → write file
 *   DELETE /agents/{id}/files/{path}       → delete file
 *   POST   /users/{userId}/provision       → create user workspace
 *   GET    /agents/{id}/status             → agent status
 */

const API_BASE =
  process.env.NEXT_PUBLIC_AGENTBOX_API_URL || 'https://gateway.pixel-drop.com/agentbox';
const API_TOKEN = process.env.NEXT_PUBLIC_AGENTBOX_API_TOKEN || '';

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VpsFile {
  path: string;
  content: string;
  size?: number;
  updated_at?: string;
}

export interface VpsFileListItem {
  path: string;
  size?: number;
  updated_at?: string;
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function vpsReadFile(agentId: string, filePath: string): Promise<string | null> {
  const encodedPath = encodeURIComponent(filePath);
  const res = await fetch(`${API_BASE}/agents/${agentId}/files/${encodedPath}`, {
    headers: headers(),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    console.error(`VPS readFile ${filePath}: HTTP ${res.status}`);
    return null;
  }
  const data: VpsFile = await res.json();
  return data.content;
}

// ─── Write ──────────────────────────────────────────────────────────────────

export async function vpsWriteFile(agentId: string, filePath: string, content: string): Promise<boolean> {
  const encodedPath = encodeURIComponent(filePath);
  const res = await fetch(`${API_BASE}/agents/${agentId}/files/${encodedPath}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    console.error(`VPS writeFile ${filePath}: HTTP ${res.status}`);
    return false;
  }
  return true;
}

// ─── List ───────────────────────────────────────────────────────────────────

export async function vpsListFiles(
  agentId: string,
  prefix?: string,
): Promise<VpsFileListItem[]> {
  const url = new URL(`${API_BASE}/agents/${agentId}/files`);
  if (prefix) url.searchParams.set('prefix', prefix);

  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) {
    if (res.status === 404) return [];
    console.error(`VPS listFiles: HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  // API may return { files: [...] } or a bare array
  return Array.isArray(data) ? data : (data.files ?? []);
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function vpsDeleteFile(agentId: string, filePath: string): Promise<boolean> {
  const encodedPath = encodeURIComponent(filePath);
  const res = await fetch(`${API_BASE}/agents/${agentId}/files/${encodedPath}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    console.error(`VPS deleteFile ${filePath}: HTTP ${res.status}`);
    return false;
  }
  return true;
}

// ─── Provision user workspace ───────────────────────────────────────────────

export async function vpsProvisionUser(userId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/users/${userId}/provision`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) {
    console.error(`VPS provisionUser: HTTP ${res.status}`);
    return false;
  }
  return true;
}

// ─── Agent status ───────────────────────────────────────────────────────────

export async function vpsAgentStatus(agentId: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API_BASE}/agents/${agentId}/status`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Convenience: create default workspace files ────────────────────────────

export async function vpsCreateDefaultFiles(
  agentId: string,
  soulContent: string,
): Promise<void> {
  await Promise.allSettled([
    vpsWriteFile(agentId, 'SOUL.md', soulContent),
    vpsWriteFile(agentId, 'TOOLS.md', ''),
    vpsWriteFile(agentId, 'MEMORY.md', ''),
  ]);
}
