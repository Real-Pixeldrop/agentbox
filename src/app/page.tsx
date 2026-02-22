"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import AgentList from "@/components/AgentList";
import AgentDetail from "@/components/AgentDetail";
import TemplateGrid from "@/components/TemplateGrid";
import { Agent } from "@/lib/types";
import { mockAgents, agentTemplates } from "@/lib/mock-data";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("agents");
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleToggle = (id: string) => {
    setAgents(agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const handleUpdate = (updated: Agent) => {
    setAgents(agents.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAgent(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentPage={currentPage} onNavigate={(page) => { setCurrentPage(page); setSelectedAgent(null); }} />

      <main className="flex-1 ml-64 p-8">
        {currentPage === "home" && (
          <div className="max-w-2xl mx-auto text-center pt-20">
            <h1 className="text-4xl font-bold text-white mb-4">Bonjour !</h1>
            <p className="text-gray-400 text-lg mb-8">Que voulez-vous faire aujourd&apos;hui ?</p>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage("agents")}
                className="w-full p-4 bg-dark-800 border border-dark-600 rounded-xl text-left hover:border-accent-blue transition-colors flex items-center gap-4"
              >
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-white font-medium">Voir mes agents</p>
                  <p className="text-gray-400 text-sm">{agents.filter(a => a.enabled).length} agent{agents.filter(a => a.enabled).length > 1 ? "s" : ""} actif{agents.filter(a => a.enabled).length > 1 ? "s" : ""}</p>
                </div>
              </button>
              <button
                onClick={() => setCurrentPage("templates")}
                className="w-full p-4 bg-dark-800 border border-dark-600 rounded-xl text-left hover:border-accent-blue transition-colors flex items-center gap-4"
              >
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-white font-medium">Créer un nouvel agent</p>
                  <p className="text-gray-400 text-sm">Depuis un template ou de zéro</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentPage === "agents" && !selectedAgent && (
          <AgentList
            agents={agents}
            onToggle={handleToggle}
            onSelect={setSelectedAgent}
            onNewAgent={() => setCurrentPage("templates")}
          />
        )}

        {currentPage === "agents" && selectedAgent && (
          <AgentDetail
            agent={selectedAgent}
            onBack={() => setSelectedAgent(null)}
            onUpdate={handleUpdate}
          />
        )}

        {currentPage === "templates" && (
          <TemplateGrid templates={agentTemplates} onSelect={(t) => alert(`Template "${t.name}" sélectionné ! (fonctionnalité en cours)`)} />
        )}

        {currentPage === "activity" && (
          <div className="text-center pt-20">
            <span className="text-5xl">📊</span>
            <h2 className="text-2xl font-bold text-white mt-4">Activité globale</h2>
            <p className="text-gray-400 mt-2">Vue d&apos;ensemble de tous vos agents (bientôt disponible)</p>
          </div>
        )}

        {currentPage === "settings" && (
          <div className="text-center pt-20">
            <span className="text-5xl">⚙️</span>
            <h2 className="text-2xl font-bold text-white mt-4">Paramètres</h2>
            <p className="text-gray-400 mt-2">Configuration du workspace (bientôt disponible)</p>
          </div>
        )}
      </main>
    </div>
  );
}
