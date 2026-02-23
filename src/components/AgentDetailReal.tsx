"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Brain, 
  Database, 
  MessageSquare,
  Save, 
  Search,
  ChevronRight, 
  FileText,
  CalendarDays,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '@/lib/i18n';
import { useGateway } from '@/lib/GatewayContext';
import type { Agent } from '@/lib/supabase';
import AgentConversation from './AgentConversation';
import { createGatewayFileManager } from '@/lib/gateway-file-ops';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentDetailRealProps {
  agent: Agent;
  onBack: () => void;
}

interface MemoryFile {
  name: string;
  path: string;
  content?: string;
  lastModified?: string;
}

export default function AgentDetailReal({ agent, onBack }: AgentDetailRealProps) {
  const { t } = useI18n();
  const { isConnected, send, client } = useGateway();
  const [activeTab, setActiveTab] = useState('personality');
  const [soulContent, setSoulContent] = useState('');
  const [soulLoading, setSoulLoading] = useState(false);
  const [soulSaving, setSoulSaving] = useState(false);
  const [memoryFiles, setMemoryFiles] = useState<MemoryFile[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [selectedMemoryFile, setSelectedMemoryFile] = useState<MemoryFile | null>(null);
  const [editingMemoryFile, setEditingMemoryFile] = useState<string>('');
  const [memoryFileSaving, setMemoryFileSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tabs = [
    { id: 'personality', label: 'Personnalité', icon: Brain },
    { id: 'memory', label: 'Mémoire', icon: Database },
    { id: 'conversation', label: 'Conversation', icon: MessageSquare },
  ];

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load agent configuration and SOUL.md on mount
  useEffect(() => {
    if (isConnected && agent.gateway_agent_id) {
      loadAgentConfig();
    }
  }, [isConnected, agent.gateway_agent_id]);

  // Load memory files when memory tab is selected
  useEffect(() => {
    if (activeTab === 'memory' && isConnected && agent.gateway_agent_id) {
      loadMemoryFiles();
    }
  }, [activeTab, isConnected, agent.gateway_agent_id]);

  const loadAgentConfig = async () => {
    if (!isConnected) return;
    
    setSoulLoading(true);
    setError(null);
    
    try {
      const result = await send<any>('config.get', {});
      setConfig(result);
      
      // Find our agent in the config
      const agentConfig = result?.agents?.list?.find((a: any) => a.id === agent.gateway_agent_id);
      if (agentConfig && agentConfig['SOUL.md']) {
        setSoulContent(agentConfig['SOUL.md']);
      } else {
        // If no SOUL.md exists, create a default one
        setSoulContent(generateDefaultSoul(agent));
      }
    } catch (err) {
      setError(`Failed to load agent config: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSoulLoading(false);
    }
  };

  const generateDefaultSoul = (agent: Agent): string => {
    return `# SOUL.md - ${agent.name}

## Identity
You are ${agent.name}, ${agent.description || 'an AI assistant'}.
You work autonomously to help your human with their daily tasks.

## Personality
${agent.tone === 'formal' ? '- Professional and formal communication style' : 
  agent.tone === 'friendly' ? '- Friendly and approachable' : 
  '- Direct and to-the-point'}
- Proactive — anticipate needs before being asked
- Reliable and consistent in your responses

## Communication Style
- Use clear, structured messages
- Provide context for recommendations
- Be concise unless detail is requested

## Industry Focus
${agent.industry ? `- Specialized in ${agent.industry}` : '- General purpose assistant'}

## Constraints
- Never share confidential information
- Escalate complex decisions to the human
- Respect boundaries and privacy

## Goals
- Provide excellent assistance
- Maintain organized workflow
- Build trust through reliability`;
  };

  const loadMemoryFiles = async () => {
    if (!isConnected) return;
    
    setMemoryLoading(true);
    setError(null);
    
    try {
      // First get the workspace path from config
      const workspacePath = config?.agents?.defaults?.workspace || '/root/agentbox-workspace';
      const agentWorkspace = `${workspacePath}/${agent.gateway_agent_id}`;
      
      // For now, we'll simulate the memory files structure
      // In a real implementation, you might need a custom endpoint to list files
      const defaultMemoryFiles: MemoryFile[] = [
        { name: 'MEMORY.md', path: `${agentWorkspace}/MEMORY.md` },
        { name: 'TOOLS.md', path: `${agentWorkspace}/TOOLS.md` },
      ];
      
      // Add daily memory files for the last 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        defaultMemoryFiles.push({
          name: `${dateStr}.md`,
          path: `${agentWorkspace}/memory/${dateStr}.md`
        });
      }
      
      setMemoryFiles(defaultMemoryFiles);
    } catch (err) {
      setError(`Failed to load memory files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setMemoryLoading(false);
    }
  };

  const saveSoulContent = async () => {
    if (!isConnected || !config) return;
    
    setSoulSaving(true);
    setError(null);
    
    try {
      // Find the current agent in config
      const agentsList = config.agents?.list || [];
      const agentIndex = agentsList.findIndex((a: any) => a.id === agent.gateway_agent_id);
      
      let updatedAgentsList;
      if (agentIndex >= 0) {
        // Update existing agent
        updatedAgentsList = [...agentsList];
        updatedAgentsList[agentIndex] = {
          ...updatedAgentsList[agentIndex],
          'SOUL.md': soulContent,
        };
      } else {
        // Add new agent config
        const newAgent = {
          id: agent.gateway_agent_id,
          name: agent.name,
          'SOUL.md': soulContent,
          enabled: true,
          workspace: `${config.agents?.defaults?.workspace || '/root/agentbox-workspace'}/${agent.gateway_agent_id}`,
        };
        updatedAgentsList = [...agentsList, newAgent];
      }
      
      // Apply the new configuration
      const newConfig = {
        ...config,
        agents: {
          ...config.agents,
          list: updatedAgentsList,
        },
      };
      
      await send('config.apply', newConfig);
      setConfig(newConfig);
      setSuccess('SOUL.md saved successfully!');
    } catch (err) {
      setError(`Failed to save SOUL.md: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSoulSaving(false);
    }
  };

  const loadMemoryFileContent = async (file: MemoryFile) => {
    if (!isConnected || !agent.gateway_agent_id) return;
    
    setSelectedMemoryFile({ ...file, content: undefined });
    setEditingMemoryFile('');
    
    try {
      const fileManager = createGatewayFileManager();
      const content = await fileManager.readFile(agent.gateway_agent_id, file.name);
      setSelectedMemoryFile({ ...file, content });
      setEditingMemoryFile(content);
    } catch (err) {
      setError(`Failed to load ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const saveMemoryFile = async () => {
    if (!isConnected || !agent.gateway_agent_id || !selectedMemoryFile) return;
    
    setMemoryFileSaving(true);
    setError(null);
    
    try {
      const fileManager = createGatewayFileManager();
      await fileManager.writeFile(agent.gateway_agent_id, selectedMemoryFile.name, editingMemoryFile);
      setSelectedMemoryFile({ ...selectedMemoryFile, content: editingMemoryFile });
      setSuccess(`${selectedMemoryFile.name} saved successfully!`);
    } catch (err) {
      setError(`Failed to save ${selectedMemoryFile.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setMemoryFileSaving(false);
    }
  };

  const generateDefaultMemoryContent = (fileName: string): string => {
    if (fileName === 'MEMORY.md') {
      return `# MEMORY.md - Long-term Memory

## Context
- Agent: ${agent.name}
- Created: ${new Date().toISOString().split('T')[0]}

## Key Learnings
- No significant learnings recorded yet
- This file will be updated as the agent gains experience

## Important Notes
- Add important context and learnings here
- This memory persists across sessions`;
    }
    
    if (fileName === 'TOOLS.md') {
      return `# TOOLS.md - Available Tools

## Configured Skills
${agent.skills.map(skill => `- ${skill}`).join('\n')}

## Tool Configuration
- Workspace access enabled
- File operations available
- Communication channels configured

## Usage Notes
- Tools are automatically available to the agent
- Configuration is managed through the AgentBox interface`;
    }
    
    if (fileName.match(/\d{4}-\d{2}-\d{2}\.md/)) {
      return `# Daily Memory - ${fileName.replace('.md', '')}

## Session Summary
No activities recorded for this date.

## Key Events
- 

## Notes
- `;
    }
    
    return '# Memory File\n\nContent will be loaded from the agent workspace.';
  };

  const sessionKey = agent.gateway_session_key || `agent:${agent.gateway_agent_id}:main`;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200">
      {/* Top Nav */}
      <nav className="border-b border-[#1E293B] px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0B0F1A]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <h1 className="text-sm font-medium tracking-tight text-slate-400">
            Mes Agents / <span className="text-white">{agent.name}</span>
          </h1>
        </div>
        
        {/* Connection status */}
        {!isConnected && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Gateway déconnecté - Mode démo</span>
          </div>
        )}
      </nav>

      {/* Status messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-8 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-8 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-300">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <header className="flex items-center gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-700">
              {agent.photo_url ? (
                <img src={agent.photo_url} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {agent.name[0].toUpperCase()}
                </div>
              )}
            </div>
            {agent.status === 'active' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-3 border-[#0B0F1A] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-white tracking-tight">{agent.name}</h2>
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded",
                agent.status === 'active'
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-slate-800 text-slate-500 border-slate-700"
              )}>
                {agent.status === 'active' ? 'ACTIF' : 'INACTIF'}
              </span>
            </div>
            <p className="text-slate-400 text-base mb-3">{agent.description || agent.industry}</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Gateway</span>
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-bold",
                  isConnected ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  {isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group",
                  activeTab === tab.id 
                    ? "text-blue-400 bg-blue-500/5" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full"
                  />
                )}
                <tab.icon className={cn("w-4.5 h-4.5", activeTab === tab.id ? "text-blue-400" : "text-slate-500")} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* PERSONALITY TAB */}
                {activeTab === 'personality' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-mono font-bold text-blue-400 tracking-wide">SOUL.MD</span>
                        {!isConnected && (
                          <span className="text-[10px] text-amber-400 italic">Mode démo</span>
                        )}
                      </div>
                      
                      {isConnected && (
                        <button
                          onClick={saveSoulContent}
                          disabled={soulSaving || soulLoading}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            soulSaving 
                              ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                          )}
                        >
                          {soulSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Sauvegarder
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* SOUL.md Editor */}
                    <div className="bg-[#131825] rounded-2xl border border-[#1E293B] overflow-hidden focus-within:border-blue-500/30 transition-colors min-h-[450px] flex flex-col">
                      <div className="px-4 py-2.5 bg-[#1A2234] border-b border-[#1E293B] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-mono font-bold text-blue-400">SOUL.MD</span>
                        </div>
                        {isConnected && (
                          <span className="text-[10px] font-mono text-slate-600">
                            Agent: {agent.gateway_agent_id || agent.name}
                          </span>
                        )}
                      </div>
                      
                      {soulLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Chargement...</span>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={soulContent}
                          onChange={(e) => setSoulContent(e.target.value)}
                          className="flex-1 p-5 bg-transparent outline-none font-mono text-sm leading-relaxed resize-none text-slate-300 min-h-[400px]"
                          spellCheck={false}
                          placeholder={!isConnected ? "En mode démo - connectez le gateway pour éditer" : "Décrivez la personnalité de votre agent..."}
                          readOnly={!isConnected}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* MEMORY TAB */}
                {activeTab === 'memory' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8">
                      {selectedMemoryFile ? (
                        <div className="bg-[#0D1117] rounded-xl border border-[#1E293B] overflow-hidden h-[550px] flex flex-col">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-[#161B22] border-b border-[#1E293B]">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-mono text-blue-400 font-bold tracking-wide">{selectedMemoryFile.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isConnected && selectedMemoryFile.content && (
                                <button
                                  onClick={saveMemoryFile}
                                  disabled={memoryFileSaving}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                                    memoryFileSaving 
                                      ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-500 text-white"
                                  )}
                                >
                                  {memoryFileSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  {memoryFileSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedMemoryFile(null);
                                  setEditingMemoryFile('');
                                }}
                                className="text-slate-500 hover:text-white text-xs"
                              >
                                Fermer
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex-1 overflow-hidden">
                            {selectedMemoryFile.content ? (
                              isConnected ? (
                                <textarea
                                  value={editingMemoryFile}
                                  onChange={(e) => setEditingMemoryFile(e.target.value)}
                                  className="w-full h-full p-5 bg-transparent outline-none font-mono text-sm leading-relaxed resize-none text-slate-300"
                                  spellCheck={false}
                                />
                              ) : (
                                <div className="p-5 h-full overflow-auto">
                                  <pre className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                                    {selectedMemoryFile.content}
                                  </pre>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-2 text-slate-500">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Chargement du contenu...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#131825] rounded-xl border border-[#1E293B] p-8 h-[550px] flex items-center justify-center">
                          <div className="text-center">
                            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-sm">Sélectionnez un fichier mémoire pour le visualiser</p>
                            {!isConnected && (
                              <p className="text-amber-400 text-xs mt-2">Mode démo - contenu simulé</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-4 space-y-4">
                      <div className="bg-[#131825] border border-[#1E293B] rounded-xl p-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Fichiers mémoire</h3>
                        
                        {memoryLoading ? (
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-8 bg-slate-800/50 rounded"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {memoryFiles.map((file) => (
                              <button
                                key={file.path}
                                onClick={() => loadMemoryFileContent(file)}
                                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 group cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  {file.name.includes('.md') ? (
                                    <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                                  ) : (
                                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                                  )}
                                  <span className="text-xs font-mono text-slate-400 group-hover:text-blue-400 transition-colors">
                                    {file.name}
                                  </span>
                                </div>
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] text-blue-400/70 leading-relaxed">
                          Les fichiers mémoire contiennent l'historique et les apprentissages de l'agent. 
                          MEMORY.md contient la mémoire long-terme, les fichiers datés sont les journaux quotidiens.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONVERSATION TAB */}
                {activeTab === 'conversation' && (
                  <div className="h-[600px] bg-[#131825] rounded-xl border border-[#1E293B] overflow-hidden">
                    <AgentConversation
                      agent={{
                        id: parseInt(agent.id),
                        name: agent.name,
                        role: agent.description || agent.industry || 'AI Agent',
                        photo: agent.photo_url || '',
                        active: agent.status === 'active',
                        channels: [], // TODO: get from config
                        schedule: 'Non configuré'
                      }}
                      sessionKey={sessionKey}
                      onBack={() => setActiveTab('personality')}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}