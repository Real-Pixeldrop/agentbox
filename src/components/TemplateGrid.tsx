"use client";

import { AgentTemplate } from "@/lib/types";

interface TemplateGridProps {
  templates: AgentTemplate[];
  onSelect: (template: AgentTemplate) => void;
}

export default function TemplateGrid({ templates, onSelect }: TemplateGridProps) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Templates</h2>
        <p className="text-gray-400 mt-1">Choisissez un modèle et personnalisez-le</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-left hover:border-accent-blue hover:bg-dark-700 transition-all group"
          >
            <span className="text-3xl">{template.icon}</span>
            <h3 className="text-white font-semibold mt-3 group-hover:text-accent-blue transition-colors">
              {template.name}
            </h3>
            <p className="text-gray-400 text-sm mt-2">{template.description}</p>
            <div className="flex gap-2 mt-4">
              <span className="px-2 py-0.5 bg-dark-600 rounded text-xs text-gray-300">{template.sector}</span>
              <span className="px-2 py-0.5 bg-dark-600 rounded text-xs text-gray-300">{template.tone}</span>
            </div>
          </button>
        ))}

        <button className="bg-dark-800 border-2 border-dashed border-dark-600 rounded-xl p-6 text-center hover:border-accent-blue transition-colors flex flex-col items-center justify-center min-h-[180px]">
          <span className="text-3xl mb-2">✨</span>
          <p className="text-gray-400 font-medium">Créer depuis zéro</p>
          <p className="text-gray-500 text-sm mt-1">Agent vierge à personnaliser</p>
        </button>
      </div>
    </div>
  );
}
