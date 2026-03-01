"use client";

import { useState } from "react";

const STORAGE_KEY = "dismissedSyncErrors";

export function useDismissedErrors(): [Set<number>, (jobId: number) => void] {
  const [dismissedErrors, setDismissedErrors] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dismissError = (jobId: number) => {
    setDismissedErrors((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  };

  return [dismissedErrors, dismissError];
}
