'use client';

import { Group, Panel, Separator } from 'react-resizable-panels';
import { ChatPanel } from './chat-panel';
import { PinToCanvasProvider } from '@/contexts/pin-to-canvas-context';

interface SplitPaneLayoutProps {
  children: React.ReactNode;
}

export function SplitPaneLayout({ children }: SplitPaneLayoutProps) {
  return (
    <PinToCanvasProvider>
      <Group orientation="horizontal" className="h-full">
        {/* Chat Panel - Left Side */}
        <Panel defaultSize="30%" minSize="20%" className="flex flex-col">
          <ChatPanel />
        </Panel>

        {/* Resize Handle */}
        <Separator className="w-1 bg-border hover:bg-primary/50 transition-colors data-[active]:bg-primary" />

        {/* Canvas Area - Right Side */}
        <Panel minSize="50%" className="flex flex-col">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Panel>
      </Group>
    </PinToCanvasProvider>
  );
}
