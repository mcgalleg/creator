"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

export interface Drawing {
  id: number;
  name: string;
  isDefault: boolean;
  elements: unknown[];
  appState: {
    viewBackgroundColor?: string;
    zoom?: number;
    scrollX?: number;
    scrollY?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${url}`);
  }

  return data as T;
}

export function useDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIdRef = useRef(0);

  const selectedDrawing = useMemo(() => {
    if (selectedDrawingId === null) return null;
    return drawings.find((d) => d.id === selectedDrawingId) ?? null;
  }, [drawings, selectedDrawingId]);

  const fetchDrawings = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchJson<{ drawings: Drawing[] }>("/api/drawings");

      if (currentFetchId === fetchIdRef.current) {
        setDrawings(data.drawings);

        if (data.drawings.length > 0) {
          setSelectedDrawingId((prevId) => {
            if (prevId !== null && data.drawings.some((d) => d.id === prevId)) {
              return prevId;
            }
            const defaultDrawing = data.drawings.find((d) => d.isDefault);
            return defaultDrawing?.id ?? data.drawings[0].id;
          });
        }
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch drawings";
        setError(new Error(errorMessage));
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    fetchDrawings();
  }, [fetchDrawings]);

  const createDrawing = useCallback(async (name: string): Promise<Drawing> => {
    try {
      setError(null);

      const data = await fetchJson<{ drawing: Drawing }>("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      setDrawings((prev) => [...prev, data.drawing]);
      setSelectedDrawingId(data.drawing.id);

      return data.drawing;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create drawing";
      setError(new Error(errorMessage));
      throw err;
    }
  }, []);

  const updateDrawing = useCallback(
    async (id: number, updateData: Partial<Drawing>): Promise<Drawing> => {
      try {
        setError(null);

        setDrawings((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, ...updateData, updatedAt: new Date().toISOString() } : d
          )
        );

        const data = await fetchJson<{ drawing: Drawing }>(`/api/drawings/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        setDrawings((prev) =>
          prev.map((d) => (d.id === id ? data.drawing : d))
        );

        return data.drawing;
      } catch (err) {
        fetchDrawings();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to update drawing";
        setError(new Error(errorMessage));
        throw err;
      }
    },
    [fetchDrawings]
  );

  const deleteDrawing = useCallback(
    async (id: number): Promise<void> => {
      try {
        setError(null);

        setDrawings((prev) => prev.filter((d) => d.id !== id));

        if (selectedDrawingId === id) {
          const remainingDrawings = drawings.filter((d) => d.id !== id);
          if (remainingDrawings.length > 0) {
            const defaultDrawing = remainingDrawings.find((d) => d.isDefault);
            setSelectedDrawingId(defaultDrawing?.id ?? remainingDrawings[0].id);
          } else {
            setSelectedDrawingId(null);
          }
        }

        await fetchJson<{ success: boolean }>(`/api/drawings/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        fetchDrawings();

        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete drawing";
        setError(new Error(errorMessage));
        throw err;
      }
    },
    [drawings, selectedDrawingId, fetchDrawings]
  );

  const renameDrawing = useCallback(
    async (id: number, name: string): Promise<Drawing> => {
      return updateDrawing(id, { name });
    },
    [updateDrawing]
  );

  useEffect(() => {
    fetchDrawings();
  }, [fetchDrawings]);

  return {
    drawings,
    selectedDrawing,
    selectedDrawingId,
    setSelectedDrawingId,
    createDrawing,
    updateDrawing,
    deleteDrawing,
    renameDrawing,
    isLoading,
    error,
    refetch,
  };
}
