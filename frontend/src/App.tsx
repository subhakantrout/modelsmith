import { useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Dashboard } from "./components/Dashboard";
import { PipelineCanvas } from "./components/PipelineCanvas";
import { Logo } from "./components/Logo";

type View = "welcome" | "dashboard" | "canvas";

export default function App() {
  const [view, setView] = useState<View>("welcome");

  if (view === "welcome") {
    return <WelcomeScreen onStart={() => setView("canvas")} />;
  }

  if (view === "canvas") {
    return (
      <div className="h-screen w-screen bg-gray-900 text-gray-100 flex flex-col">
        <div className="flex items-center px-4 py-2 bg-gray-950 border-b border-gray-700 gap-2">
          <Logo variant="horizontal" className="h-6 cursor-pointer" onClick={() => setView("dashboard")} />
          <span className="text-[10px] text-gray-600 mt-2">v0.1.0</span>
          <div className="flex-1" />
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
    );
  }

  return <Dashboard onOpenCanvas={() => setView("canvas")} />;
}
