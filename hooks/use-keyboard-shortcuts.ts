import { useEffect, useCallback, useState } from 'react';
import { Node, useReactFlow } from '@xyflow/react';

export interface KeyboardShortcutsConfig {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  addNode: (type: string, data: Record<string, unknown>, position?: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  onHelpOpen?: () => void;
}

export interface UseKeyboardShortcutsReturn {
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  shortcuts: ShortcutDefinition[];
}

export interface ShortcutDefinition {
  key: string;
  description: string;
  category: 'canvas' | 'nodes' | 'navigation';
}

export const shortcutDefinitions: ShortcutDefinition[] = [
  { key: 'Delete / Backspace', description: 'Remove selected nodes', category: 'nodes' },
  { key: 'Cmd/Ctrl + A', description: 'Select all nodes', category: 'nodes' },
  { key: 'Cmd/Ctrl + D', description: 'Duplicate selected nodes', category: 'nodes' },
  { key: 'Escape', description: 'Deselect all / close dialogs', category: 'nodes' },
  { key: 'N', description: 'Add new text note', category: 'canvas' },
  { key: 'S', description: 'Add new sticky note', category: 'canvas' },
  { key: 'F', description: 'Fit view (zoom to show all nodes)', category: 'navigation' },
  { key: 'Cmd/Ctrl + K', description: 'Open command palette', category: 'navigation' },
  { key: '?', description: 'Show keyboard shortcuts help', category: 'navigation' },
];

export function useKeyboardShortcuts({
  nodes,
  setNodes,
  addNode,
  removeNode,
  onHelpOpen,
}: KeyboardShortcutsConfig): UseKeyboardShortcutsReturn {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { fitView, screenToFlowPosition } = useReactFlow();

  // Get center position for new nodes
  const getCenterPosition = useCallback(() => {
    try {
      // Convert screen center to flow coordinates
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      return screenToFlowPosition({ x: centerX, y: centerY });
    } catch {
      // Fallback to random position
      return { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 };
    }
  }, [screenToFlowPosition]);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    selectedNodes.forEach((n) => removeNode(n.id));
  }, [nodes, removeNode]);

  // Select all nodes
  const selectAllNodes = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: true,
      }))
    );
  }, [setNodes]);

  // Deselect all nodes
  const deselectAllNodes = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    );
  }, [setNodes]);

  // Duplicate selected nodes
  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const newNodes: Node[] = selectedNodes.map((node) => ({
      ...node,
      id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + 30,
        y: node.position.y + 30,
      },
      selected: true,
    }));

    // Deselect original nodes and add new ones
    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ]);
  }, [nodes, setNodes]);

  // Add text note at center
  const addTextNote = useCallback(() => {
    const position = getCenterPosition();
    addNode('text-note', { content: '' }, position);
  }, [addNode, getCenterPosition]);

  // Add sticky note at center
  const addStickyNote = useCallback(() => {
    const position = getCenterPosition();
    addNode('sticky-note', { content: '', color: 'yellow' }, position);
  }, [addNode, getCenterPosition]);

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        // Still allow Escape in inputs to blur them
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Delete/Backspace - Remove selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNodes();
        return;
      }

      // Cmd/Ctrl + A - Select all nodes
      if (e.key === 'a' && modKey) {
        e.preventDefault();
        selectAllNodes();
        return;
      }

      // Cmd/Ctrl + D - Duplicate selected nodes
      if (e.key === 'd' && modKey) {
        e.preventDefault();
        duplicateSelectedNodes();
        return;
      }

      // Escape - Deselect all / close help modal
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isHelpOpen) {
          setIsHelpOpen(false);
        } else {
          deselectAllNodes();
        }
        return;
      }

      // N - Add text note (when not typing and no modifier keys)
      if (e.key === 'n' && !modKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        addTextNote();
        return;
      }

      // S - Add sticky note (when not typing and no modifier keys)
      if (e.key === 's' && !modKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        addStickyNote();
        return;
      }

      // F - Fit view (when not typing and no modifier keys)
      if (e.key === 'f' && !modKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        fitView({ padding: 0.2 });
        return;
      }

      // ? - Show help modal
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsHelpOpen(true);
        onHelpOpen?.();
        return;
      }
    },
    [
      deleteSelectedNodes,
      selectAllNodes,
      deselectAllNodes,
      duplicateSelectedNodes,
      addTextNote,
      addStickyNote,
      fitView,
      isHelpOpen,
      onHelpOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    isHelpOpen,
    setIsHelpOpen,
    shortcuts: shortcutDefinitions,
  };
}
