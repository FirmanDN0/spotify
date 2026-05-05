"use client";

import { useToastStore } from "@/lib/toast";
import { ListMusic, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-28 md:bottom-28 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-cyan-500 text-black px-5 py-3 rounded-full shadow-xl shadow-cyan-500/20 animate-toast-in font-medium text-sm"
        >
          <ListMusic className="w-4 h-4 flex-shrink-0" />
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="hover:bg-black/10 rounded-full p-0.5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
