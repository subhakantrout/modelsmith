import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Dashboard } from "./components/Dashboard";
import { PipelineCanvas } from "./components/PipelineCanvas";
import { DownloadManager } from "./components/DownloadManager";
import { Logo } from "./components/Logo";
import { ToastProvider } from "./components/ToastProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useTheme } from "./lib/useTheme";

type View = "welcome" | "dashboard" | "canvas";

export default function App() {
  const [view, setView] = useState<View>("welcome");
  const { theme, toggleTheme } = useTheme();

  return (
    <ErrorBoundary>
      <div className={`transition-opacity duration-300 ${view === "welcome" ? "opacity-100" : ""}`}>
        {view === "welcome" && <WelcomeScreen onStart={() => setView("canvas")} />}
        {view === "canvas" && (
          <div className="h-screen w-screen bg-gray-900 text-gray-100 flex flex-col animate-fade-in">
            <div className="flex items-center px-4 py-2 bg-gray-950 border-b border-gray-700 gap-2">
              <Logo variant="horizontal" className="h-6 cursor-pointer" onClick={() => setView("dashboard")} />
              <span className="text-[10px] text-gray-600 mt-2">v1.0.0</span>
              <div className="flex-1" />
              <button
                onClick={toggleTheme}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={() => setView("dashboard")}
                className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200"
              >
                Dashboard
              </button>
            </div>
            <div className="flex-1">
              <PipelineCanvas />
            </div>
          </div>
        )}
        {view === "dashboard" && <Dashboard onOpenCanvas={() => setView("canvas")} />}
        <DownloadManager />
        <ToastProvider />
      </div>
    </ErrorBoundary>
  );
}
