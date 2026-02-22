"use client";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Accueil", icon: "🏠" },
    { id: "agents", label: "Mes Agents", icon: "🤖" },
    { id: "templates", label: "Templates", icon: "📋" },
    { id: "activity", label: "Activité", icon: "📊" },
    { id: "settings", label: "Paramètres", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-dark-600">
        <h1 className="text-xl font-bold text-white">AgentBox</h1>
        <p className="text-sm text-gray-400 mt-1">Vos agents IA</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              currentPage === item.id
                ? "bg-accent-blue/20 text-accent-blue"
                : "text-gray-300 hover:bg-dark-700 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-600">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-white">Mon Workspace</p>
            <p className="text-xs text-gray-400">Plan Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
