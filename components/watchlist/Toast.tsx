"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ToastItem {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let currentToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((l) => l([...currentToasts]));
}

export function showToast(options: Omit<ToastItem, "id">): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const toast: ToastItem = {
    ...options,
    id,
    duration: options.duration ?? 4500,
  };

  currentToasts = [toast, ...currentToasts.slice(0, 2)];
  notify();

  if (toast.duration && toast.duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, toast.duration);
  }

  return id;
}

export function dismissToast(id: string): void {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  notify();
}

export function clearToasts(): void {
  currentToasts = [];
  notify();
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setToasts([...currentToasts]);
    const listener: ToastListener = (newToasts) => {
      setToasts(newToasts);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl backdrop-blur-md text-xs font-medium"
          >
            <span className="flex-1 line-clamp-2">{toast.message}</span>

            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
                className="px-2.5 py-1 rounded bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {toast.actionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Close notification"
              className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition-colors"
            >
              &times;
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
