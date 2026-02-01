'use client';

import { createContext, useContext, useCallback, useState, useRef, ReactNode } from 'react';
import type { UITree } from '@/hooks/use-analytics-chat';

export interface PinToCanvasData {
  title: string;
  uiTree: UITree;
  position?: { x: number; y: number };
}

/**
 * Callback type for pin events (fire-and-forget).
 */
export type PinCallback = (data: PinToCanvasData) => void;

/**
 * Callback type for render events (returns nodeId).
 */
export type RenderCallback = (data: PinToCanvasData) => Promise<string>;

/**
 * Queued render request when canvas is not mounted.
 */
interface QueuedRender {
  data: PinToCanvasData;
  resolve: (nodeId: string) => void;
  reject: (error: Error) => void;
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
  onPin: (callback: PinCallback) => () => void;

  /**
   * Whether a pin animation is currently in progress.
   */
  isPinning: boolean;

  /**
   * Render a component directly to canvas.
   * Returns a promise that resolves with the nodeId of the created node.
   * If no canvas is mounted, the request is queued and processed when canvas mounts.
   */
  renderToCanvas: (data: PinToCanvasData) => Promise<string>;

  /**
   * Render multiple components as separate nodes on the canvas.
   * Returns a promise that resolves with an array of nodeIds.
   */
  renderMultipleToCanvas: (components: PinToCanvasData[]) => Promise<string[]>;

  /**
   * Subscribe to render events. Returns an unsubscribe function.
   * The callback should return the nodeId of the created node.
   */
  onRender: (callback: RenderCallback) => () => void;

  /**
   * Whether there are queued renders waiting for the canvas to mount.
   * Useful for showing indicators on the Canvas tab.
   */
  hasQueuedRenders: boolean;
}

const PinToCanvasContext = createContext<PinToCanvasContextValue | null>(null);

interface PinToCanvasProviderProps {
  children: ReactNode;
}

export function PinToCanvasProvider({ children }: PinToCanvasProviderProps) {
  const [isPinning, setIsPinning] = useState(false);
  const [pinSubscribers] = useState<Set<PinCallback>>(() => new Set());
  const [renderCallbacks] = useState<Set<RenderCallback>>(() => new Set());

  // Queue for render requests when canvas is not mounted
  const renderQueueRef = useRef<QueuedRender[]>([]);
  const [hasQueuedRenders, setHasQueuedRenders] = useState(false);

  const pinToCanvas = useCallback(async (data: PinToCanvasData) => {
    setIsPinning(true);

    // Notify all subscribers (the canvas)
    pinSubscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in pin subscriber:', error);
      }
    });

    // Short delay for animation
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsPinning(false);
  }, [pinSubscribers]);

  const onPin = useCallback((callback: PinCallback) => {
    pinSubscribers.add(callback);
    return () => {
      pinSubscribers.delete(callback);
    };
  }, [pinSubscribers]);

  // Process queued renders when a callback becomes available
  const processQueue = useCallback(async (callback: RenderCallback) => {
    const queue = [...renderQueueRef.current];
    renderQueueRef.current = [];
    setHasQueuedRenders(false);

    for (const item of queue) {
      try {
        const nodeId = await callback(item.data);
        item.resolve(nodeId);
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error('Render failed'));
      }
    }
  }, []);

  const renderToCanvas = useCallback(async (data: PinToCanvasData): Promise<string> => {
    // Call all registered render callbacks and return the first nodeId
    for (const callback of renderCallbacks) {
      try {
        const nodeId = await callback(data);
        if (nodeId) return nodeId;
      } catch (error) {
        console.error('Error in render callback:', error);
      }
    }

    // No callback registered - queue the request for when canvas mounts
    return new Promise((resolve, reject) => {
      renderQueueRef.current.push({ data, resolve, reject });
      setHasQueuedRenders(true);
    });
  }, [renderCallbacks]);

  const renderMultipleToCanvas = useCallback(async (components: PinToCanvasData[]): Promise<string[]> => {
    const nodeIds: string[] = [];
    for (const component of components) {
      const nodeId = await renderToCanvas(component);
      nodeIds.push(nodeId);
    }
    return nodeIds;
  }, [renderToCanvas]);

  const onRender = useCallback((callback: RenderCallback) => {
    renderCallbacks.add(callback);

    // Process any queued renders
    if (renderQueueRef.current.length > 0) {
      processQueue(callback);
    }

    return () => {
      renderCallbacks.delete(callback);
    };
  }, [renderCallbacks, processQueue]);

  return (
    <PinToCanvasContext.Provider value={{
      pinToCanvas,
      onPin,
      isPinning,
      renderToCanvas,
      renderMultipleToCanvas,
      onRender,
      hasQueuedRenders,
    }}>
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
