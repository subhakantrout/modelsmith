import { useState, useCallback } from "react";
import { useChatStore, useModelStore } from "../stores";
import { Markdown } from "./Markdown";
import { Send, Trash2, AlertCircle, MessageSquare, Cpu } from "lucide-react";

export function ChatView() {
  const inspectedModel = useModelStore((s) => s.inspectedModel);
  const [prompt, setPrompt] = useState("");

  const modelLoaded = inspectedModel !== null;

  if (!modelLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <div className="p-3 rounded-xl bg-gray-800/50 text-gray-500 w-fit mx-auto">
            <Cpu size={32} />
          </div>
          <h3 className="text-sm font-semibold text-gray-300">No Model Loaded</h3>
          <p className="text-xs text-gray-500">
            Load a model using the Pipeline Canvas before chatting. Add a Model Input node, configure it, and run the pipeline.
          </p>
        </div>
      </div>
    );
  }
  const messages = useChatStore((s) => s.messages);
  const generating = useChatStore((s) => s.generating);
  const error = useChatStore((s) => s.error);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearMessages = useChatStore((s) => s.clearMessages);

  const handleSend = useCallback(() => {
    if (!prompt.trim() || generating) return;
    sendMessage(prompt);
    setPrompt("");
  }, [prompt, generating, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !generating && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <MessageSquare size={32} className="text-gray-700" />
            <p className="text-sm text-gray-500">Send a message to start chatting</p>
            <p className="text-[11px] text-gray-600">Press Enter to send, Shift+Enter for new line</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-indigo-600/80 text-white"
                : "bg-gray-800/80 border border-gray-700/50 text-gray-200"
            }`}>
              {msg.role === "assistant" ? <Markdown content={msg.content} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
            </div>
          </div>
        ))}

        {generating && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-gray-400 animate-pulse">
              Generating...
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-2.5 text-xs text-red-300">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!prompt.trim() || generating}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end"
          >
            <Send size={16} />
          </button>
          <button
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="p-2.5 rounded-xl bg-gray-800 border border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
