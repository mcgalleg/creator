"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface DrawingStateData {
  elements: unknown[];
  appState: {
    viewBackgroundColor?: string;
    zoom?: number;
    scrollX?: number;
    scrollY?: number;
  } | null;
}

export function useDrawingState(drawingId: number | null) {
  const [elements, setElements] = useState<readonly unknown[]>([]);
  const [appState, setAppState] = useState<DrawingStateData["appState"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ elements: unknown[]; appState: unknown } | null>(null);
  const currentDrawingIdRef = useRef<number | null>(null);

  // Load drawing data when drawingId changes
  useEffect(() => {
    currentDrawingIdRef.current = drawingId;

    if (drawingId === null) {
      setElements([]);
      setAppState(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/drawings/${drawingId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load drawing");
        }

        if (!cancelled && currentDrawingIdRef.current === drawingId) {
          setElements(data.drawing.elements || []);
          setAppState(data.drawing.appState || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load drawing"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [drawingId]);

  // Save function
  const save = useCallback(async (elementsToSave: unknown[], appStateToSave: unknown) => {
    if (currentDrawingIdRef.current === null) return;

    const id = currentDrawingIdRef.current;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/drawings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elements: elementsToSave,
          appState: appStateToSave,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save drawing");
      }

      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Failed to save drawing:", err);
      setError(err instanceof Error ? err : new Error("Failed to save"));
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced save on change
  const onElementsChange = useCallback(
    (newElements: readonly unknown[], newAppState: Record<string, unknown>) => {
      setElements(newElements);

      const rawZoom = ((newAppState.zoom as { value?: number })?.value ?? newAppState.zoom) as number | undefined;
      const appStateToSave = {
        viewBackgroundColor: newAppState.viewBackgroundColor as string | undefined,
        // Guard against NaN/Infinity zoom (can happen when canvas has zero dimensions)
        zoom: (rawZoom != null && isFinite(rawZoom) && rawZoom > 0) ? rawZoom : undefined,
        scrollX: newAppState.scrollX as number | undefined,
        scrollY: newAppState.scrollY as number | undefined,
      };
      setAppState(appStateToSave);

      // When canvas is cleared (reset), save immediately so the empty state
      // is persisted before any subsequent onChange can overwrite it.
      if (newElements.length === 0) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        pendingSaveRef.current = null;
        save([], appStateToSave);
        return;
      }

      // Store the pending save data
      pendingSaveRef.current = {
        elements: [...newElements],
        appState: appStateToSave,
      };

      // Debounce the save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          save(pendingSaveRef.current.elements, pendingSaveRef.current.appState);
          pendingSaveRef.current = null;
        }
      }, 750);
    },
    [save]
  );

  // Add AI-generated elements to the scene
  const addElements = useCallback((newElements: unknown[]) => {
    setElements((prev) => {
      const merged = [...prev, ...newElements];
      pendingSaveRef.current = { elements: merged, appState };
      return merged;
    });

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        save(pendingSaveRef.current.elements, pendingSaveRef.current.appState);
        pendingSaveRef.current = null;
      }
    }, 750);
  }, [appState, save]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Flush pending save on unmount
      if (pendingSaveRef.current && currentDrawingIdRef.current !== null) {
        save(pendingSaveRef.current.elements, pendingSaveRef.current.appState);
      }
    };
  }, [save]);

  return {
    elements,
    appState,
    onElementsChange,
    addElements,
    isLoading,
    isSaving,
    error,
    lastSavedAt,
  };
}
