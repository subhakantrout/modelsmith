import { useState, useCallback } from "react";
import { useChatStore, useModelStore } from "../stores";

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"before" | "after">("before");
  const messages = useChatStore((s) => s.messages);
  const generating = useChatStore((s) => s.generating);
  const error = useChatStore((s) => s.error);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const analyzeRefusal = useModelStore((s) => s.analyzeRefusal);
  const clearAnalysis = useModelStore((s) => s.clearAnalysis);
  const analysis = useModelStore((s) => s.analysis);
  const loading = useModelStore((s) => s.loading);

  const handleSend = useCallback(() => {
    if (!prompt.trim() || generating) return;
    clearAnalysis();
    sendMessage(prompt);
    setPrompt("");
  }, [prompt, generating, sendMessage, clearAnalysis]);

  const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop();

  return (
    <div className="w-72 sm:w-80 lg:w-96 border-l border-gray-700 bg-gray-900 flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-100">Chat Test</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg leading-none">×</button>
      </div>

      <div className="flex border-b border-gray-700">
        <button onClick={() => setMode("before")} className={`flex-1 py-2 text-xs font-medium ${mode === "before" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-500 hover:text-gray-300"}`}>Before</button>
        <button onClick={() => setMode("after")} className={`flex-1 py-2 text-xs font-medium ${mode === "after" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-500 hover:text-gray-300"}`}>After</button>
      </div>

      <div className="px-4 py-3 border-b border-gray-700">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter a test prompt..." rows={2} className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 resize-none" />
        <div className="flex gap-2 mt-2">
          <button onClick={handleSend} disabled={!prompt.trim() || generating} className="flex-1 px-3 py-1 text-xs font-medium bg-blue-600 text-gray-100 rounded hover:bg-blue-500 disabled:opacity-50">Send</button>
          <button onClick={clearMessages} className="px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Clear</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`${msg.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200 border border-gray-700"}`}>{msg.content}</div>
          </div>
        ))}
        {generating && (
          <div className="text-left">
            <div className="inline-block bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 animate-pulse">Generating...</div>
          </div>
        )}
        {error && <div className="bg-red-900/50 border border-red-700 rounded-lg p-2"><p className="text-xs text-red-300">{error}</p></div>}
        {messages.length === 0 && !generating && (
          <div className="text-center text-gray-500 text-xs py-8">Send a prompt to chat with the loaded model</div>
        )}
      </div>

      {lastAssistantMessage && !generating && (
        <div className="px-4 py-3 border-t border-gray-700">
          <button onClick={() => analyzeRefusal(lastAssistantMessage.content)} disabled={loading} className="w-full px-3 py-1 text-xs font-medium bg-yellow-600 text-gray-100 rounded hover:bg-yellow-500 disabled:opacity-50">
            {loading ? "Analyzing..." : "Analyze for Refusal"}
          </button>
          {analysis && (
            <div className="mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-2 text-xs"><span className="text-gray-400">Score:</span><span className="font-mono text-gray-100">{analysis.refusal_score.toFixed(2)}</span><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${analysis.refusal_level === "high" ? "bg-red-900 text-red-200" : analysis.refusal_level === "medium" ? "bg-yellow-900 text-yellow-200" : analysis.refusal_level === "low" ? "bg-blue-900 text-blue-200" : "bg-green-900 text-green-200"}`}>{analysis.refusal_level}</span></div>
              {analysis.matched_patterns.length > 0 && <div className="text-xs text-gray-400">Matched: <span className="text-gray-300">{analysis.matched_patterns.join(", ")}</span></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
