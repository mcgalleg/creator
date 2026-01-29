'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasState } from '@/hooks/use-canvas-state';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { usePinToCanvasOptional, type PinToCanvasData } from '@/contexts/pin-to-canvas-context';
import { nodeTypes } from './nodes';
import { CanvasToolbar } from './canvas-toolbar';
import { CommandPalette } from '@/components/command-palette';
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help';

/**
 * Hook to detect if we're on a mobile/tablet viewport
 * MiniMap is hidden on smaller screens for better UX
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

function AnalyticsCanvasInner() {
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    addNode,
    removeNode,
    clearCanvas,
  } = useCanvasState();

  const { zoomIn, zoomOut, fitView, getViewport } = useReactFlow();
  const pinContext = usePinToCanvasOptional();

  // Initialize keyboard shortcuts
  const { isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts({
    nodes,
    setNodes,
    addNode,
    removeNode,
  });

  // Subscribe to pin events from the chat
  useEffect(() => {
    if (!pinContext) return;

    const handlePin = async (data: PinToCanvasData) => {
      // Calculate position - place in the center of the current viewport
      const viewport = getViewport();
      const position = data.position ?? {
        x: (-viewport.x + 400) / viewport.zoom,
        y: (-viewport.y + 200) / viewport.zoom,
      };

      // Add slight randomization to prevent exact overlaps
      position.x += Math.random() * 50 - 25;
      position.y += Math.random() * 50 - 25;

      // Create the node with delete handler and pinned animation
      const nodeId = addNode('analyticsCard', {
        title: data.title,
        uiTree: data.uiTree,
        onDelete: () => removeNode(nodeId),
      }, position, { className: 'node-new node-pinned' });

      // Save to the pinned API with canvas data
      try {
        await fetch('/api/pinned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componentType: 'analyticsCard',
            title: data.title,
            configuration: { uiTree: data.uiTree },
            canvasData: {
              x: position.x,
              y: position.y,
              width: 300,
              height: 200,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to save pinned component:', error);
      }
    };

    return pinContext.onPin(handlePin);
  }, [pinContext, addNode, removeNode, getViewport]);

  const isMobile = useIsMobile();

  const handleAddNode = useCallback((type: string, data?: Record<string, unknown>) => {
    addNode(type, data || {});
  }, [addNode]);

  return (
    <div className="w-full h-full touch-pan-x touch-pan-y">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        panOnScroll
        selectionOnDrag
        className="bg-background"
        // Enable pinch-to-zoom on touch devices
        zoomOnPinch
        // Disable zoom on scroll for mobile to prevent accidental zooms
        zoomOnScroll={!isMobile}
        // Better touch handling - allow panning with any number of fingers on mobile
        panOnDrag={isMobile ? [0, 1, 2] : true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="bg-background"
        />
        {/* Controls - hide built-in zoom controls on mobile, we use toolbar instead */}
        <Controls
          className="bg-surface border-border"
          showZoom={!isMobile}
          showFitView={!isMobile}
          showInteractive={!isMobile}
        />
        {/* MiniMap hidden on mobile/tablet for better UX */}
        {!isMobile && (
          <MiniMap
            className="bg-surface border-border"
            nodeColor="#00F5D4"
            maskColor="rgba(0, 0, 0, 0.8)"
          />
        )}
        <CanvasToolbar
          onAddNode={handleAddNode}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitView={fitView}
          onShowHelp={() => setIsHelpOpen(true)}
          isMobile={isMobile}
        />
      </ReactFlow>
      <CommandPalette
        onAddNode={handleAddNode}
        onFitView={fitView}
        onClearCanvas={clearCanvas}
      />
      <KeyboardShortcutsHelp
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
      />
    </div>
  );
}

export function AnalyticsCanvas() {
  return (
    <ReactFlowProvider>
      <AnalyticsCanvasInner />
    </ReactFlowProvider>
  );
}
