import { useViewStore, type AppView } from "../stores/viewStore";
import { useSystemStore } from "../stores";
import {
  LayoutDashboard, Box, Cpu, MessageSquare, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";

const NAV_ITEMS: { view: AppView; icon: typeof LayoutDashboard; label: string }[] = [
  { view: "home", icon: LayoutDashboard, label: "Home" },
  { view: "canvas", icon: Box, label: "Canvas" },
  { view: "models", icon: Cpu, label: "Models" },
  { view: "chat", icon: MessageSquare, label: "Chat" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const currentView = useViewStore((s) => s.currentView);
  const setView = useViewStore((s) => s.setView);
  const sidebarOpen = useViewStore((s) => s.sidebarOpen);
  const toggleSidebar = useViewStore((s) => s.toggleSidebar);
  const tier = useSystemStore((s) => s.info?.tier);

  if (!sidebarOpen) {
    return (
      <nav className="w-[24px] h-full bg-gray-950 border-r border-gray-800 flex flex-col items-center py-2 gap-1 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
          title="Open sidebar"
        >
          <ChevronRight size={14} />
        </button>
      </nav>
    );
  }

  return (
    <nav className="w-[52px] h-full bg-gray-950 border-r border-gray-800 flex flex-col items-center py-3 gap-1 shrink-0">
      {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => setView(view)}
          className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
            currentView === view
              ? "text-indigo-400 bg-indigo-500/15"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          }`}
          title={label}
        >
          <Icon size={18} />
          {currentView === view && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
          )}
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={toggleSidebar}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
        title="Close sidebar"
      >
        <ChevronLeft size={16} />
      </button>
      {tier !== undefined && (
        <span className="text-[10px] font-mono text-gray-600 px-1 py-0.5 rounded border border-gray-800">
          T{tier}
        </span>
      )}
    </nav>
  );
}
