'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import type { UITree } from '@/hooks/use-analytics-chat';

export interface PinToCanvasData {
  title: string;
  uiTree: UITree;
  position?: { x: number; y: number };
}

interface PinToCanvasContextValue {
  /**
   * Pin a visualization from chat to the canvas.
   * Returns a promise that resolves when the pin is complete.
   */
  pinToCanvas: (data: PinToCanvasData) => Promise<void>;

  /**
   * Subscribe to pin events. Returns an unsubscribe function.
   */
  onPin: (callback: (data: PinToCanvasData) => void) => () => void;

  /**
   * Whether a pin animation is currently in progress.
   */
  isPinning: boolean;
}

const PinToCanvasContext = createContext<PinToCanvasContextValue | null>(null);

interface PinToCanvasProviderProps {
  children: ReactNode;
}

export function PinToCanvasProvider({ children }: PinToCanvasProviderProps) {
  const [isPinning, setIsPinning] = useState(false);
  const [subscribers] = useState<Set<(data: PinToCanvasData) => void>>(() => new Set());

  const pinToCanvas = useCallback(async (data: PinToCanvasData) => {
    setIsPinning(true);

    // Notify all subscribers (the canvas)
    subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in pin subscriber:', error);
      }
    });

    // Short delay for animation
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsPinning(false);
  }, [subscribers]);

  const onPin = useCallback((callback: (data: PinToCanvasData) => void) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, [subscribers]);

  return (
    <PinToCanvasContext.Provider value={{ pinToCanvas, onPin, isPinning }}>
      {children}
    </PinToCanvasContext.Provider>
  );
}

export function usePinToCanvas() {
  const context = useContext(PinToCanvasContext);
  if (!context) {
    throw new Error('usePinToCanvas must be used within a PinToCanvasProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider.
 * Useful for components that may or may not have pin functionality.
 */
export function usePinToCanvasOptional() {
  return useContext(PinToCanvasContext);
}
