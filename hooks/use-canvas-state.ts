import { useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';

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
}

export function useCanvasState(
  initialNodes: Node[] = [],
  initialEdges: Edge[] = []
): UseCanvasStateReturn {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
  };
}
