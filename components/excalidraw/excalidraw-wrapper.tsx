"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { useDrawingBridgeOptional } from "@/contexts/drawing-bridge-context";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Dynamic import of inner component (loads Excalidraw + its CSS client-side only)
const ExcalidrawDynamic = dynamic(
  () => import("./excalidraw-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface ExcalidrawWrapperProps {
  initialElements?: readonly unknown[];
  initialAppState?: Record<string, unknown> | null;
  onChange?: (elements: readonly unknown[], appState: Record<string, unknown>) => void;
}

export function ExcalidrawWrapper({
  initialElements,
  initialAppState,
  onChange,
}: ExcalidrawWrapperProps) {
  const { resolvedTheme } = useTheme();
  const excalidrawAPIRef = useRef<any>(null);
  const drawingBridge = useDrawingBridgeOptional();
  const [isReady, setIsReady] = useState(false);

  const handleAPIReady = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
    setIsReady(true);
  }, []);

  const handleChange = useCallback(
    (elements: any, appState: any) => {
      onChange?.(elements, appState);
    },
    [onChange]
  );

  // Ref to hold the dynamically imported convertToExcalidrawElements
  const converterRef = useRef<any>(null);
  // Track whether we need to scroll to content when the tab becomes visible
  const pendingScrollRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the Excalidraw skeleton converter once on mount
  useEffect(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      converterRef.current = mod.convertToExcalidrawElements;
    });
  }, []);

  // Scroll to content helper — only works when the container is visible
  const scrollToContent = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    const elements = api.getSceneElements();
    if (elements.length === 0) return;

    api.scrollToContent(elements, {
      fitToContent: true,
      animate: true,
      duration: 300,
    });
  }, []);

  // Watch for visibility changes to trigger pending scroll-to-content.
  // When elements are pushed while the Draw tab is hidden (display:none),
  // scrollToContent fails because the canvas has zero dimensions.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && pendingScrollRef.current) {
          pendingScrollRef.current = false;
          // Small delay to let Excalidraw recalculate after becoming visible
          setTimeout(scrollToContent, 150);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollToContent]);

  // Subscribe to drawing bridge for AI-generated elements
  useEffect(() => {
    if (!drawingBridge || !isReady) return;

    const unsubscribe = drawingBridge.onElementsPushed((data) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      // Filter out cameraUpdate elements
      const skeletonElements: any[] = [];

      for (const el of data.elements) {
        const element = el as Record<string, unknown>;
        if (element.type !== "cameraUpdate") {
          skeletonElements.push(element);
        }
      }

      // Use convertToExcalidrawElements to properly handle labels, bindings, etc.
      const convert = converterRef.current;
      const convertedElements = convert
        ? convert(skeletonElements)
        : skeletonElements;

      const addWithDelay = async () => {
        for (let i = 0; i < convertedElements.length; i++) {
          const element = convertedElements[i];
          const updatedElements = [...api.getSceneElements(), element];
          api.updateScene({ elements: updatedElements });

          if (i < convertedElements.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
        }

        // Check if the container is currently visible
        const el = containerRef.current;
        const isVisible = el ? el.offsetWidth > 0 && el.offsetHeight > 0 : false;

        if (isVisible) {
          setTimeout(scrollToContent, 100);
        } else {
          // Defer scroll until the Draw tab becomes visible
          pendingScrollRef.current = true;
        }
      };

      addWithDelay();
    });

    return unsubscribe;
  }, [drawingBridge, isReady, scrollToContent]);

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div ref={containerRef} className="h-full w-full">
      <ExcalidrawDynamic
        initialElements={initialElements}
        initialAppState={initialAppState}
        onChange={handleChange}
        onAPIReady={handleAPIReady}
        theme={theme}
      />
    </div>
  );
}
