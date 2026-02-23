"use client";

import { useCallback } from 'react';
import { useGateway } from './GatewayContext';
import {
  vpsReadFile,
  vpsWriteFile,
  vpsListFiles,
  vpsDeleteFile,
  type VpsFileListItem,
} from './agent-files-api';

/**
 * Hook for reading/writing agent workspace files.
 *
 * Strategy (priority order):
 *  1. VPS REST API (real filesystem on Hostinger VPS)
 *  2. Gateway RPC (when Clawdbot gateway is connected inside the container)
 *
 * The VPS is the source of truth for all agent files.
 * This follows the OpenClaw architecture: files = source of truth.
 */
export function useAgentFiles(agentId: string | undefined, sessionKey: string) {
  const { isConnected, send } = useGateway();

  // ─── READ a single file ──────────────────────────────────────────────

  const readFile = useCallback(async (filePath: string): Promise<string | null> => {
    if (!agentId) return null;

    // 1. Try VPS API (source of truth)
    try {
      const content = await vpsReadFile(agentId, filePath);
      if (content !== null) return content;
    } catch {
      // VPS failed, try gateway
    }

    // 2. Fallback: gateway RPC
    if (isConnected) {
      try {
        const result = await send<{ content?: string }>('files.read', {
          sessionKey,
          path: filePath,
        });
        if (result?.content !== undefined) return result.content;
      } catch {
        // Gateway also failed
      }
    }

    return null;
  }, [agentId, isConnected, send, sessionKey]);

  // ─── WRITE a single file ─────────────────────────────────────────────

  const writeFile = useCallback(async (filePath: string, content: string): Promise<void> => {
    if (!agentId) throw new Error('No agent ID');

    // 1. Write to VPS (source of truth)
    const ok = await vpsWriteFile(agentId, filePath, content);
    if (!ok) {
      throw new Error(`Failed to write ${filePath} to VPS`);
    }

    // 2. Also sync to gateway if connected (live sync to running agent)
    if (isConnected) {
      try {
        await send('files.write', { sessionKey, path: filePath, content });
      } catch {
        // Gateway sync failed — VPS write succeeded, acceptable
      }
    }
  }, [agentId, isConnected, send, sessionKey]);

  // ─── LIST files by prefix ────────────────────────────────────────────

  const listFiles = useCallback(async (prefixes: string[]): Promise<Array<{ name: string; path: string }>> => {
    if (!agentId) return [];

    // 1. Try VPS API for each prefix, merge results
    try {
      const allFiles: Array<{ name: string; path: string }> = [];
      for (const prefix of prefixes) {
        if (prefix.endsWith('/')) {
          // Directory listing
          const files = await vpsListFiles(agentId, prefix);
          allFiles.push(...files.map((f: VpsFileListItem) => ({
            name: f.path.split('/').pop() || f.path,
            path: f.path,
          })));
        } else {
          // Single file check — try to read it to see if it exists
          const content = await vpsReadFile(agentId, prefix);
          if (content !== null) {
            allFiles.push({
              name: prefix.split('/').pop() || prefix,
              path: prefix,
            });
          }
        }
      }
      if (allFiles.length > 0) return allFiles;
    } catch {
      // VPS failed, try gateway
    }

    // 2. Fallback: gateway RPC
    if (isConnected) {
      try {
        const result = await send<{ files?: Array<{ name: string; path: string }> }>('files.list', {
          sessionKey,
          paths: prefixes,
        });
        if (result?.files && result.files.length > 0) return result.files;
      } catch {
        // Gateway also failed
      }
    }

    return [];
  }, [agentId, isConnected, send, sessionKey]);

  // ─── DELETE a file ───────────────────────────────────────────────────

  const deleteFile = useCallback(async (filePath: string): Promise<void> => {
    if (!agentId) return;

    // 1. Delete from VPS
    await vpsDeleteFile(agentId, filePath);

    // 2. Try to delete from gateway
    if (isConnected) {
      try {
        await send('files.delete', { sessionKey, path: filePath });
      } catch {
        // Acceptable
      }
    }
  }, [agentId, isConnected, send, sessionKey]);

  // ─── SYNC: push a file to VPS (used by chat events) ─────────────────

  const syncFileToVps = useCallback(async (filePath: string, content: string): Promise<void> => {
    if (!agentId) return;
    await vpsWriteFile(agentId, filePath, content);
  }, [agentId]);

  // ─── Availability check ─────────────────────────────────────────────

  /** Whether we can read/write files (VPS API available if agentId exists) */
  const available = !!agentId;

  return {
    readFile,
    writeFile,
    listFiles,
    deleteFile,
    /** Sync a file from gateway to VPS (called by chat event handler) */
    syncFileToVps,
    /** @deprecated Legacy alias — use syncFileToVps */
    syncFileToSupabase: syncFileToVps,
    available,
    isConnected,
  };
}
