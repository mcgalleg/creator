"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

// ============================================================================
// Types
// ============================================================================

export interface Canvas {
  id: number;
  name: string;
  isDefault: boolean;
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseCanvasesReturn {
  canvases: Canvas[];
  selectedCanvas: Canvas | null;
  selectedCanvasId: number | null;
  setSelectedCanvasId: (id: number | null) => void;
  createCanvas: (name: string) => Promise<Canvas>;
  updateCanvas: (id: number, data: Partial<Canvas>) => Promise<Canvas>;
  deleteCanvas: (id: number) => Promise<void>;
  renameCanvas: (id: number, name: string) => Promise<Canvas>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${url}`);
  }

  return data as T;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCanvases(): UseCanvasesReturn {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedCanvasId, setSelectedCanvasId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track the current fetch to avoid race conditions
  const fetchIdRef = useRef(0);

  // Derive selectedCanvas from canvases array and selectedCanvasId
  const selectedCanvas = useMemo(() => {
    if (selectedCanvasId === null) return null;
    return canvases.find((c) => c.id === selectedCanvasId) ?? null;
  }, [canvases, selectedCanvasId]);

  // Fetch all canvases
  const fetchCanvases = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchJson<{ canvases: Canvas[] }>("/api/canvases");

      // Only update state if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current) {
        setCanvases(data.canvases);

        // Auto-select the first canvas or default canvas if none selected
        if (data.canvases.length > 0) {
          setSelectedCanvasId((prevId) => {
            // If we already have a valid selection, keep it
            if (prevId !== null && data.canvases.some((c) => c.id === prevId)) {
              return prevId;
            }
            // Otherwise, select the default canvas or first canvas
            const defaultCanvas = data.canvases.find((c) => c.isDefault);
            return defaultCanvas?.id ?? data.canvases[0].id;
          });
        }
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch canvases";
        setError(new Error(errorMessage));
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  // Create a new canvas
  const createCanvas = useCallback(async (name: string): Promise<Canvas> => {
    try {
      setError(null);

      const data = await fetchJson<{ canvas: Canvas }>("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      // Optimistically add the new canvas to the list
      setCanvases((prev) => [...prev, data.canvas]);

      // Select the newly created canvas
      setSelectedCanvasId(data.canvas.id);

      return data.canvas;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create canvas";
      setError(new Error(errorMessage));
      throw err;
    }
  }, []);

  // Update an existing canvas
  const updateCanvas = useCallback(
    async (id: number, updateData: Partial<Canvas>): Promise<Canvas> => {
      try {
        setError(null);

        // Optimistically update local state
        setCanvases((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, ...updateData, updatedAt: new Date().toISOString() } : c
          )
        );

        const data = await fetchJson<{ canvas: Canvas }>(`/api/canvases/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        // Update with the server response
        setCanvases((prev) =>
          prev.map((c) => (c.id === id ? data.canvas : c))
        );

        return data.canvas;
      } catch (err) {
        // Revert optimistic update on error by refetching
        fetchCanvases();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to update canvas";
        setError(new Error(errorMessage));
        throw err;
      }
    },
    [fetchCanvases]
  );

  // Delete a canvas
  const deleteCanvas = useCallback(
    async (id: number): Promise<void> => {
      try {
        setError(null);

        // Optimistically remove from local state
        setCanvases((prev) => prev.filter((c) => c.id !== id));

        // If we deleted the selected canvas, select another one
        if (selectedCanvasId === id) {
          const remainingCanvases = canvases.filter((c) => c.id !== id);
          if (remainingCanvases.length > 0) {
            const defaultCanvas = remainingCanvases.find((c) => c.isDefault);
            setSelectedCanvasId(defaultCanvas?.id ?? remainingCanvases[0].id);
          } else {
            setSelectedCanvasId(null);
          }
        }

        await fetchJson<{ success: boolean }>(`/api/canvases/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        // Revert optimistic update on error by refetching
        fetchCanvases();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete canvas";
        setError(new Error(errorMessage));
        throw err;
      }
    },
    [canvases, selectedCanvasId, fetchCanvases]
  );

  // Convenience wrapper for renaming a canvas
  const renameCanvas = useCallback(
    async (id: number, name: string): Promise<Canvas> => {
      return updateCanvas(id, { name });
    },
    [updateCanvas]
  );

  // Fetch canvases on mount
  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  return {
    canvases,
    selectedCanvas,
    selectedCanvasId,
    setSelectedCanvasId,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    renameCanvas,
    isLoading,
    error,
    refetch,
  };
}
