'use client';

import { createContext, useContext, useCallback, useState, useRef, ReactNode } from 'react';

export interface DrawingBridgeData {
  title: string;
  elements: unknown[];
}

type ElementsPushedCallback = (data: DrawingBridgeData) => void;

interface DrawingBridgeContextValue {
  /**
   * Push AI-generated elements to the Excalidraw editor.
   * Called from the chat when a diagram is created.
   */
  pushElements: (data: DrawingBridgeData) => void;

  /**
   * Subscribe to element push events.
   * Called by the ExcalidrawWrapper to receive elements.
   * Returns an unsubscribe function.
   */
  onElementsPushed: (callback: ElementsPushedCallback) => () => void;

  /**
   * Whether new content has been pushed since last viewed.
   * Used to show a badge on the Draw tab.
   */
  hasNewContent: boolean;

  /**
   * Mark content as viewed (clear the badge).
   */
  markContentViewed: () => void;

  /**
   * Switch to the Draw tab programmatically.
   * Used by "View in Draw" buttons in chat.
   */
  switchToDrawTab: () => void;

  /**
   * Register a callback for switching to the Draw tab.
   * Called by the layout component that controls tab state.
   */
  registerTabSwitcher: (switcher: () => void) => void;
}

const DrawingBridgeContext = createContext<DrawingBridgeContextValue | null>(null);

interface DrawingBridgeProviderProps {
  children: ReactNode;
}

export function DrawingBridgeProvider({ children }: DrawingBridgeProviderProps) {
  const [hasNewContent, setHasNewContent] = useState(false);
  const subscribersRef = useRef<Set<ElementsPushedCallback>>(new Set());
  const tabSwitcherRef = useRef<(() => void) | null>(null);

  const pushElements = useCallback((data: DrawingBridgeData) => {
    setHasNewContent(true);

    subscribersRef.current.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in drawing bridge subscriber:', error);
      }
    });
  }, []);

  const onElementsPushed = useCallback((callback: ElementsPushedCallback) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const markContentViewed = useCallback(() => {
    setHasNewContent(false);
  }, []);

  const switchToDrawTab = useCallback(() => {
    setHasNewContent(false);
    tabSwitcherRef.current?.();
  }, []);

  const registerTabSwitcher = useCallback((switcher: () => void) => {
    tabSwitcherRef.current = switcher;
  }, []);

  return (
    <DrawingBridgeContext.Provider value={{
      pushElements,
      onElementsPushed,
      hasNewContent,
      markContentViewed,
      switchToDrawTab,
      registerTabSwitcher,
    }}>
      {children}
    </DrawingBridgeContext.Provider>
  );
}

export function useDrawingBridge() {
  const context = useContext(DrawingBridgeContext);
  if (!context) {
    throw new Error('useDrawingBridge must be used within a DrawingBridgeProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider.
 */
export function useDrawingBridgeOptional() {
  return useContext(DrawingBridgeContext);
}
