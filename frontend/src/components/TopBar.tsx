import { useViewStore } from "../stores/viewStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTheme } from "../lib/useTheme";
import { Logo } from "./Logo";
import { Sun, Moon, Key, Check, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const VIEW_LABELS: Record<string, string> = {
  home: "Home",
  canvas: "Pipeline Canvas",
  models: "Models",
  chat: "Chat",
  settings: "Settings",
};

function TokenPopover() {
  const { hfToken, setHfToken } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(hfToken);
  const [showToken, setShowToken] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    setInputValue(hfToken);
  }, [hfToken]);

  const handleSave = () => {
    setHfToken(inputValue);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setOpen(false); setInputValue(hfToken); }
  };

  const hasToken = hfToken.length > 0;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => { setOpen(!open); setInputValue(hfToken); }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
          hasToken
            ? "bg-green-900/30 text-green-400 border border-green-700/40 hover:bg-green-800/40"
            : "bg-gray-800/60 text-gray-500 border border-gray-700/40 hover:text-gray-300 hover:border-gray-600"
        }`}
        title={hasToken ? "HF Token configured" : "Add HuggingFace token"}
      >
        <Key size={11} />
        {hasToken && <Check size={10} className="text-green-400" />}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl shadow-black/40 backdrop-blur-xl z-50 p-3"
        >
          <div className="text-[11px] font-semibold text-gray-300 mb-2">
            HuggingFace Token
          </div>
          <div className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
            Required for gated models (Llama, Gemma, etc.). Stored locally in your browser.
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex-1 relative">
              <input
                type={showToken ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-2.5 py-1.5 text-xs bg-gray-800 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 font-mono"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => { setOpen(false); setInputValue(hfToken); }}
              className="px-3 py-1 text-[11px] text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-[11px] font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const currentView = useViewStore((s) => s.currentView);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-11 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60 flex items-center px-4 gap-3 shrink-0">
      <Logo variant="horizontal" className="h-5" />
      <span className="text-[10px] text-gray-600 mt-0.5">v1.0.0</span>
      <div className="w-px h-4 bg-gray-800" />
      <span className="text-xs text-gray-400 font-medium">{VIEW_LABELS[currentView]}</span>
      <div className="flex-1" />
      <TokenPopover />
      <button
        onClick={toggleTheme}
        className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </header>
  );
}
