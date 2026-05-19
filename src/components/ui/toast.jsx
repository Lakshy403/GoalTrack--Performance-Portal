import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, description, variant = "default", duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const variantConfig = {
  default: { icon: Info, bgClass: "bg-[hsl(var(--color-card))] border-[hsl(var(--color-border))]" },
  success: { icon: CheckCircle2, bgClass: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800" },
  error: { icon: AlertCircle, bgClass: "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800" },
  warning: { icon: AlertTriangle, bgClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800" },
};

function Toast({ toast, onClose }) {
  const config = variantConfig[toast.variant] || variantConfig.default;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-slide-in",
        config.bgClass
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
        {toast.description && (
          <p className="text-sm text-[hsl(var(--color-muted-foreground))] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button onClick={onClose} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
