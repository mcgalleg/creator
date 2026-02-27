"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { useDrawingBridgeOptional } from "@/contexts/drawing-bridge-context";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { ExcalidrawElement, ExcalidrawAPI } from "@/types/excalidraw";

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
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);
  const drawingBridge = useDrawingBridgeOptional();
  const [isReady, setIsReady] = useState(false);

  const handleAPIReady = useCallback((api: ExcalidrawAPI) => {
    excalidrawAPIRef.current = api;
    setIsReady(true);
  }, []);

  const handleChange = useCallback(
    (elements: readonly unknown[], appState: Record<string, unknown>) => {
      onChange?.(elements, appState);
    },
    [onChange]
  );

  // Ref to hold the dynamically imported convertToExcalidrawElements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Excalidraw converter accepts skeleton elements
  const converterRef = useRef<any>(null);
  // Track whether we need to scroll to content when the tab becomes visible
  const pendingScrollRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the Excalidraw skeleton converter once on mount
  useEffect(() => {
    import("@/lib/excalidraw-loader").then(({ loadExcalidraw }) =>
      loadExcalidraw().then((mod) => {
        converterRef.current = mod.convertToExcalidrawElements;
      })
    );
  }, []);

  // Scroll to content helper — only works when the container has real dimensions.
  // Retries a few times because the canvas may not have recalculated yet after
  // transitioning from display:none to visible.
  const scrollToContent = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    const elements = api.getSceneElements();
    if (elements.length === 0) return;

    let attempts = 0;
    const maxAttempts = 5;

    const tryScroll = () => {
      const el = containerRef.current;
      if (!el || (el.offsetWidth === 0 && el.offsetHeight === 0)) {
        // Container still has zero dimensions — retry
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryScroll, 100);
        }
        return;
      }

      api.scrollToContent(elements, {
        fitToContent: true,
        animate: true,
        duration: 300,
      });

      // Verify zoom didn't end up as NaN — if so, reset to a sane default
      setTimeout(() => {
        const appState = api.getAppState?.();
        const zoom = appState?.zoom as { value?: number } | number | undefined;
        const zoomVal = typeof zoom === "object" && zoom !== null ? zoom.value : zoom;
        if (typeof zoomVal !== "number" || !isFinite(zoomVal)) {
          api.updateScene({
            appState: { zoom: { value: 1 } },
          });
        }
      }, 50);
    };

    tryScroll();
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

      // Filter to valid Excalidraw element types only
      const VALID_EXCALIDRAW_TYPES = new Set([
        "rectangle", "ellipse", "diamond", "text", "arrow", "line",
        "freedraw", "image", "frame", "embeddable",
      ]);
      const skeletonElements: Record<string, unknown>[] = [];

      for (const el of data.elements) {
        const element = el as Record<string, unknown>;
        if (element.type === "cameraUpdate") continue;
        // Normalize "circle" → "ellipse" (Excalidraw uses ellipse, not circle)
        if (element.type === "circle") {
          skeletonElements.push({ ...element, type: "ellipse" });
        } else if (VALID_EXCALIDRAW_TYPES.has(element.type as string)) {
          skeletonElements.push(element);
        }
        // Skip unknown types (e.g. "badge") that would crash convertToExcalidrawElements
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
        initialElements={initialElements ?? []}
        initialAppState={initialAppState ?? null}
        onChange={handleChange}
        onAPIReady={handleAPIReady}
        theme={theme}
      />
    </div>
  );
}
