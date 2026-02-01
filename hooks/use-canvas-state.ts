import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  Viewport,
} from '@xyflow/react';

// ============================================================================
// Types
// ============================================================================

export interface UseCanvasStateOptions {
  canvasId?: number | null;
  /** Optional callback to get current viewport for saving */
  getViewport?: () => Viewport;
  /** Optional callback to set viewport when loading */
  setViewport?: (viewport: Viewport) => void;
}

export interface CanvasData {
  id: number;
  name: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseCanvasStateReturn {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string, data: Record<string, unknown>, position?: { x: number; y: number }, options?: { className?: string }) => string;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => void;
  removeEdge: (id: string) => void;
  clearCanvas: () => void;
  // Persistence-related returns
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  lastSavedAt: Date | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchCanvas(canvasId: number): Promise<CanvasData> {
  const response = await fetch(`/api/canvases/${canvasId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch canvas');
  }

  return data.canvas;
}

async function saveCanvas(
  canvasId: number,
  payload: { nodes?: Node[]; edges?: Edge[]; viewport?: Viewport }
): Promise<CanvasData> {
  const response = await fetch(`/api/canvases/${canvasId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save canvas');
  }

  return data.canvas;
}

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): { debouncedFn: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { debouncedFn, cancel };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCanvasState(options?: UseCanvasStateOptions): UseCanvasStateReturn {
  const canvasId = options?.canvasId;
  const getViewport = options?.getViewport;
  const setViewport = options?.setViewport;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Persistence state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Refs for tracking state
  const initialLoadCompleteRef = useRef(false);
  const currentCanvasIdRef = useRef<number | null>(null);
  const saveDebounceRef = useRef<{ debouncedFn: (nodes: Node[], edges: Edge[]) => void; cancel: () => void } | null>(null);

  // Store callbacks in refs to avoid recreating debounced function
  const getViewportRef = useRef(getViewport);
  getViewportRef.current = getViewport;

  const setViewportRef = useRef(setViewport);
  setViewportRef.current = setViewport;

  // Save function
  const performSave = useCallback(
    async (nodesToSave: Node[], edgesToSave: Edge[]) => {
      if (!canvasId || !initialLoadCompleteRef.current) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const payload: { nodes: Node[]; edges: Edge[]; viewport?: Viewport } = {
          nodes: nodesToSave,
          edges: edgesToSave,
        };

        // Include viewport if callback is available
        if (getViewportRef.current) {
          payload.viewport = getViewportRef.current();
        }

        await saveCanvas(canvasId, payload);
        setLastSavedAt(new Date());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save canvas';
        setError(new Error(errorMessage));
        console.error('Error saving canvas:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [canvasId]
  );

  // Setup debounced save when canvasId changes
  useEffect(() => {
    if (canvasId) {
      const { debouncedFn, cancel } = debounce(performSave, 750);
      saveDebounceRef.current = { debouncedFn, cancel };

      return () => {
        cancel();
      };
    } else {
      saveDebounceRef.current = null;
    }
  }, [canvasId, performSave]);

  // Trigger save when nodes or edges change
  useEffect(() => {
    if (canvasId && initialLoadCompleteRef.current && saveDebounceRef.current) {
      saveDebounceRef.current.debouncedFn(nodes, edges);
    }
  }, [canvasId, nodes, edges]);

  // Load canvas data when canvasId changes
  useEffect(() => {
    // Reset state when canvasId changes
    if (currentCanvasIdRef.current !== canvasId) {
      initialLoadCompleteRef.current = false;
      currentCanvasIdRef.current = canvasId ?? null;

      // Clear current state
      setNodes([]);
      setEdges([]);
      setError(null);
      setLastSavedAt(null);
    }

    if (!canvasId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadCanvas = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const canvas = await fetchCanvas(canvasId);

        if (cancelled) return;

        // Set nodes and edges from canvas data
        setNodes(canvas.nodes || []);
        setEdges(canvas.edges || []);

        // Set viewport if available and callback is provided
        if (canvas.viewport && setViewportRef.current) {
          // Use setTimeout to ensure ReactFlow has rendered the nodes
          setTimeout(() => {
            if (!cancelled && setViewportRef.current && canvas.viewport) {
              setViewportRef.current(canvas.viewport);
            }
          }, 0);
        }

        setLastSavedAt(canvas.updatedAt ? new Date(canvas.updatedAt) : null);

        // Mark initial load as complete after a small delay
        // This prevents the initial setState from triggering a save
        setTimeout(() => {
          if (!cancelled) {
            initialLoadCompleteRef.current = true;
          }
        }, 100);
      } catch (err) {
        if (cancelled) return;

        const errorMessage = err instanceof Error ? err.message : 'Failed to load canvas';
        setError(new Error(errorMessage));
        console.error('Error loading canvas:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCanvas();

    return () => {
      cancelled = true;
    };
  }, [canvasId, setNodes, setEdges]);

  // Node operations
  const addNode = useCallback(
    (type: string, data: Record<string, unknown>, position?: { x: number; y: number }, options?: { className?: string }) => {
      const nodeId = `${type}-${Date.now()}`;
      const newNode: Node = {
        id: nodeId,
        type,
        position: position ?? { x: Math.random() * 400, y: Math.random() * 400 },
        data,
        className: options?.className ?? 'node-new',
      };
      setNodes((nds) => [...nds, newNode]);

      // Remove the animation class after the animation completes
      if (options?.className || !options) {
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, className: node.className?.replace('node-new', '').replace('node-pinned', '').trim() || undefined }
                : node
            )
          );
        }, 600);
      }

      return nodeId;
    },
    [setNodes]
  );

  const removeNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      // Also remove any edges connected to this node
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    },
    [setNodes, setEdges]
  );

  const updateNodeData = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
    },
    [setNodes]
  );

  const addEdge = useCallback(
    (source: string, target: string, sourceHandle?: string, targetHandle?: string) => {
      const newEdge: Edge = {
        id: `edge-${source}-${target}-${Date.now()}`,
        source,
        target,
        sourceHandle,
        targetHandle,
      };
      setEdges((eds) => [...eds, newEdge]);
    },
    [setEdges]
  );

  const removeEdge = useCallback(
    (id: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== id));
    },
    [setEdges]
  );

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    addNode,
    removeNode,
    updateNodeData,
    addEdge,
    removeEdge,
    clearCanvas,
    // Persistence state
    isLoading,
    isSaving,
    error,
    lastSavedAt,
  };
}
