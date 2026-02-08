'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels';
import type { PanelSize } from 'react-resizable-panels';
import { PanelLeftClose, PanelLeft, Loader2 } from 'lucide-react';
import { DrawingBridgeProvider } from '@/contexts/drawing-bridge-context';
import { Button } from '@/components/ui/button';

// Dynamically import ChatPanel to defer AI SDK compilation
const ChatPanel = dynamic(
  () => import('./chat-panel').then((mod) => mod.ChatPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

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
    <DrawingBridgeProvider>
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

        {/* Draw Area - Right Side */}
        <Panel minSize="50%" className="flex flex-col">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Panel>
      </Group>
    </DrawingBridgeProvider>
  );
}
