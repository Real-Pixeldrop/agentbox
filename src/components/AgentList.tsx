"use client";

import { Agent } from "@/lib/types";

interface AgentListProps {
  agents: Agent[];
  onToggle: (id: string) => void;
  onSelect: (agent: Agent) => void;
  onNewAgent: () => void;
}

export default function AgentList({ agents, onToggle, onSelect, onNewAgent }: AgentListProps) {
  const getChannelBadges = (agent: Agent) => {
    const badges = [];
    if (agent.channels.whatsapp.enabled) badges.push("WhatsApp");
    if (agent.channels.email.enabled) badges.push("Email");
    if (agent.channels.telegram.enabled) badges.push("Telegram");
    if (agent.channels.imessage.enabled) badges.push("iMessage");
    return badges;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Mes Agents</h2>
          <p className="text-gray-400 mt-1">{agents.length} agent{agents.length > 1 ? "s" : ""} configuré{agents.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={onNewAgent}
          className="px-5 py-2.5 bg-accent-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Nouvel Agent
        </button>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-dark-600 text-sm text-gray-400 font-medium">
          <div className="col-span-4">Nom</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-3">Canaux</div>
          <div className="col-span-2">Dernière activité</div>
          <div className="col-span-1 text-right">Actif</div>
        </div>

        {agents.map((agent) => (
          <div
            key={agent.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors items-center"
            onClick={() => onSelect(agent)}
          >
            <div className="col-span-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                agent.enabled ? "bg-accent-blue" : "bg-gray-600"
              }`}>
                {agent.name[0]}
              </div>
              <div>
                <p className="text-white font-medium">{agent.name}</p>
                <p className="text-gray-400 text-sm">{agent.sector}</p>
              </div>
            </div>

            <div className="col-span-2">
              <span className={`inline-flex items-center gap-1.5 text-sm ${
                agent.enabled ? "text-green-400" : "text-gray-500"
              }`}>
                <span className={`w-2 h-2 rounded-full ${agent.enabled ? "bg-green-400" : "bg-gray-500"}`}></span>
                {agent.enabled ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="col-span-3 flex gap-2 flex-wrap">
              {getChannelBadges(agent).map((badge) => (
                <span key={badge} className="px-2 py-0.5 bg-dark-600 rounded text-xs text-gray-300">
                  {badge}
                </span>
              ))}
              {getChannelBadges(agent).length === 0 && (
                <span className="text-gray-500 text-sm">Aucun canal</span>
              )}
            </div>

            <div className="col-span-2 text-sm text-gray-400">
              {agent.lastRun || "Jamais"}
            </div>

            <div className="col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onToggle(agent.id)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  agent.enabled ? "bg-accent-blue" : "bg-dark-600"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  agent.enabled ? "left-6" : "left-0.5"
                }`}></span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
