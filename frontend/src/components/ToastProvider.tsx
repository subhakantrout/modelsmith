import { useToastStore } from "../stores/toastStore";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgClass = "bg-gray-800 border-gray-700 text-gray-200";
        let iconClass = "text-blue-400";

        if (toast.type === "success") {
          Icon = CheckCircle;
          bgClass = "bg-green-950/80 border-green-800 text-green-100";
          iconClass = "text-green-400";
        } else if (toast.type === "error") {
          Icon = XCircle;
          bgClass = "bg-red-950/80 border-red-800 text-red-100";
          iconClass = "text-red-400";
        } else if (toast.type === "warning") {
          Icon = AlertTriangle;
          bgClass = "bg-yellow-950/80 border-yellow-800 text-yellow-100";
          iconClass = "text-yellow-400";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl min-w-[300px] max-w-md animate-fade-in-up ${bgClass}`}
          >
            <Icon size={18} className={iconClass} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={14} className="opacity-70" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
