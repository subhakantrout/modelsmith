import { useSettingsStore } from "../stores/settingsStore";
import { useTheme } from "../lib/useTheme";
import { useState } from "react";
import { Key, Eye, EyeOff, Sun, Moon, Cpu, Info } from "lucide-react";

// Token state shared with TopBar.tsx via settingsStore.hfToken — single source of truth

export function SettingsView() {
  const { hfToken, setHfToken } = useSettingsStore();
  const { theme, toggleTheme } = useTheme();
  const [tokenInput, setTokenInput] = useState(hfToken);
  const [showToken, setShowToken] = useState(false);

  const handleSaveToken = () => {
    setHfToken(tokenInput);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-lg font-semibold text-gray-100">Settings</h1>

        {/* HuggingFace Token */}
        <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">HuggingFace Token</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Required to download gated models (Llama, Gemma, etc.)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 font-mono"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <button
              onClick={handleSaveToken}
              className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Save
            </button>
          </div>
          {hfToken && (
            <p className="text-[10px] text-green-500/80">Token saved locally</p>
          )}
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Theme</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Toggle between dark and light mode
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-gray-800 border border-gray-600/50 rounded-lg text-gray-200 hover:bg-gray-700 transition-all"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </div>

        {/* System Info */}
        <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Cpu size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">System</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Platform information
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>ModelSmith v1.0.0</p>
            <p>All processing runs on local hardware</p>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-500/20 text-gray-400">
              <Info size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">About</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                ModelSmith — Surgical model editing for local AI
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Built with FastAPI, React, PyTorch</p>
            <p>Uses Transformers, bitsandbytes, GGUF, and more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
