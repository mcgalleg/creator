'use client';

import { useState, useEffect, useCallback } from 'react';
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels';
import type { PanelSize } from 'react-resizable-panels';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { ChatPanel } from './chat-panel';
import { PinToCanvasProvider } from '@/contexts/pin-to-canvas-context';
import { Button } from '@/components/ui/button';

interface SplitPaneLayoutProps {
  children: React.ReactNode;
}

export function SplitPaneLayout({ children }: SplitPaneLayoutProps) {
  const chatPanelRef = usePanelRef();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const togglePanel = useCallback(() => {
    const panel = chatPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  }, [chatPanelRef]);

  // Handle keyboard shortcut (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        togglePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  // Handle panel resize to track collapsed state
  const handlePanelResize = useCallback((panelSize: PanelSize) => {
    setIsCollapsed(panelSize.asPercentage === 0);
  }, []);

  return (
    <PinToCanvasProvider>
      <Group orientation="horizontal" className="h-full">
        {/* Chat Panel - Left Side */}
        <Panel
          panelRef={chatPanelRef}
          defaultSize="30%"
          minSize="20%"
          collapsible
          collapsedSize="0%"
          onResize={handlePanelResize}
          className="flex flex-col"
        >
          <ChatPanel />
        </Panel>

        {/* Resize Handle */}
        <Separator className="relative w-1.5 bg-border hover:bg-primary/50 transition-colors data-[active]:bg-primary">
          {/* Always visible toggle button */}
          <Button
            variant="default"
            size="icon"
            onClick={togglePanel}
            className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 h-8 w-8 rounded-full shadow-lg border-2 border-background hover:scale-110 transition-transform"
            aria-label={isCollapsed ? 'Expand chat panel' : 'Collapse chat panel'}
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </Separator>

        {/* Canvas Area - Right Side */}
        <Panel minSize="50%" className="relative flex flex-col">
          {/* Persistent toggle button when collapsed */}
          {isCollapsed && (
            <Button
              variant="default"
              size="icon"
              onClick={togglePanel}
              className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform"
              aria-label="Expand chat panel"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Panel>
      </Group>
    </PinToCanvasProvider>
  );
}
