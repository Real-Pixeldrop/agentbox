"use client";

import { useState } from "react";
import { Agent } from "@/lib/types";

interface AgentDetailProps {
  agent: Agent;
  onBack: () => void;
  onUpdate: (agent: Agent) => void;
}

type Tab = "personality" | "channels" | "skills" | "activity";

export default function AgentDetail({ agent, onBack, onUpdate }: AgentDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("personality");
  const [editAgent, setEditAgent] = useState<Agent>({ ...agent });

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "personality", label: "Personnalité", icon: "🎭" },
    { id: "channels", label: "Canaux", icon: "📡" },
    { id: "skills", label: "Compétences", icon: "⚡" },
    { id: "activity", label: "Activité", icon: "📊" },
  ];

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        enabled ? "bg-accent-blue" : "bg-dark-600"
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
        enabled ? "left-6" : "left-0.5"
      }`}></span>
    </button>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        ← Retour aux agents
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
          editAgent.enabled ? "bg-accent-blue" : "bg-gray-600"
        }`}>
          {editAgent.name[0]}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{editAgent.name}</h2>
          <p className="text-gray-400">{editAgent.sector}</p>
        </div>
        <div className="ml-auto">
          <Toggle enabled={editAgent.enabled} onChange={() => setEditAgent({ ...editAgent, enabled: !editAgent.enabled })} />
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-dark-800 rounded-lg p-1 border border-dark-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-dark-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-600 p-6">
        {activeTab === "personality" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom de l&apos;assistant</label>
              <input
                type="text"
                value={editAgent.name}
                onChange={(e) => setEditAgent({ ...editAgent, name: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ton</label>
              <div className="flex gap-3">
                {(["formel", "friendly", "direct"] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setEditAgent({ ...editAgent, tone })}
                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      editAgent.tone === tone
                        ? "border-accent-blue bg-accent-blue/20 text-accent-blue"
                        : "border-dark-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {tone === "formel" ? "🎩 Formel" : tone === "friendly" ? "😊 Friendly" : "⚡ Direct"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secteur / Métier</label>
              <input
                type="text"
                value={editAgent.sector}
                onChange={(e) => setEditAgent({ ...editAgent, sector: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Instructions spéciales</label>
              <textarea
                value={editAgent.instructions}
                onChange={(e) => setEditAgent({ ...editAgent, instructions: e.target.value })}
                rows={4}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-blue focus:outline-none resize-none"
                placeholder="Décrivez le comportement souhaité de l'assistant..."
              />
            </div>
          </div>
        )}

        {activeTab === "channels" && (
          <div className="space-y-4">
            {[
              { key: "whatsapp" as const, label: "WhatsApp", icon: "💬", field: "number", placeholder: "+33..." },
              { key: "email" as const, label: "Email", icon: "📧", field: "address", placeholder: "email@example.com" },
              { key: "telegram" as const, label: "Telegram", icon: "✈️", field: "token", placeholder: "Bot token..." },
              { key: "imessage" as const, label: "iMessage", icon: "🍎", field: null, placeholder: "" },
            ].map((channel) => (
              <div key={channel.key} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-dark-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{channel.icon}</span>
                  <div>
                    <p className="text-white font-medium">{channel.label}</p>
                    {channel.key === "imessage" && (
                      <span className="text-xs text-accent-orange">Premium</span>
                    )}
                  </div>
                </div>
                <Toggle
                  enabled={editAgent.channels[channel.key].enabled}
                  onChange={() => setEditAgent({
                    ...editAgent,
                    channels: {
                      ...editAgent.channels,
                      [channel.key]: { ...editAgent.channels[channel.key], enabled: !editAgent.channels[channel.key].enabled }
                    }
                  })}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-4">
            {[
              { key: "emails" as const, label: "Gestion Emails", desc: "Tri, réponses, suivi", icon: "📧" },
              { key: "calendar" as const, label: "Calendrier", desc: "RDV, rappels, préparation", icon: "📅" },
              { key: "prospection" as const, label: "Prospection", desc: "Recherche, qualification, relances", icon: "🎯" },
              { key: "crm" as const, label: "CRM", desc: "Pipeline, contacts, suivi", icon: "📊" },
              { key: "reminders" as const, label: "Rappels", desc: "Notifications, follow-ups", icon: "🔔" },
            ].map((skill) => (
              <div key={skill.key} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-dark-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{skill.icon}</span>
                  <div>
                    <p className="text-white font-medium">{skill.label}</p>
                    <p className="text-gray-400 text-sm">{skill.desc}</p>
                  </div>
                </div>
                <Toggle
                  enabled={editAgent.skills[skill.key]}
                  onChange={() => setEditAgent({
                    ...editAgent,
                    skills: { ...editAgent.skills, [skill.key]: !editAgent.skills[skill.key] }
                  })}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            {editAgent.activity.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">📭</p>
                <p>Aucune activité pour le moment</p>
                <p className="text-sm mt-1">Activez l&apos;agent pour commencer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {editAgent.activity.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-dark-700 transition-colors">
                    <span className="text-gray-500 text-sm font-mono w-14 shrink-0">{log.timestamp}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{log.action}</p>
                      <p className="text-gray-400 text-sm">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6 gap-3">
        <button onClick={onBack} className="px-5 py-2.5 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors">
          Annuler
        </button>
        <button
          onClick={() => onUpdate(editAgent)}
          className="px-5 py-2.5 bg-accent-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
}
