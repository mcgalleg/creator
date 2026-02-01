'use client';

import { createContext, useContext, ReactNode } from 'react';

interface CanvasActionsContextValue {
  removeNode: (id: string) => void;
}

const CanvasActionsContext = createContext<CanvasActionsContextValue | null>(null);

interface CanvasActionsProviderProps {
  children: ReactNode;
  removeNode: (id: string) => void;
}

export function CanvasActionsProvider({ children, removeNode }: CanvasActionsProviderProps) {
  return (
    <CanvasActionsContext.Provider value={{ removeNode }}>
      {children}
    </CanvasActionsContext.Provider>
  );
}

export function useCanvasActions() {
  const context = useContext(CanvasActionsContext);
  if (!context) {
    throw new Error('useCanvasActions must be used within a CanvasActionsProvider');
  }
  return context;
}
