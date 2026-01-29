'use client';

import { useState } from 'react';
import { MessageSquare, LayoutGrid } from 'lucide-react';
import { ChatPanel } from './chat-panel';
import { SplitPaneLayout } from './split-pane-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

/**
 * Responsive layout that adapts to different screen sizes:
 * - Desktop (lg+): Full split-pane layout with resizable panels
 * - Tablet (md): Tabs-based navigation between Chat and Canvas
 * - Mobile (sm and below): Canvas fullscreen with chat as slide-in drawer
 */
export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [mobileTab, setMobileTab] = useState<'canvas' | 'chat'>('canvas');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      {/* Desktop: Full split-pane layout (lg and above) */}
      <div className="hidden lg:block h-full">
        <SplitPaneLayout>{children}</SplitPaneLayout>
      </div>

      {/* Tablet: Tabs-based navigation (md only) */}
      <div className="hidden md:flex lg:hidden h-full flex-col">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as 'canvas' | 'chat')}
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
            <TabsTrigger
              value="canvas"
              className="min-h-[44px] min-w-[44px] gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Canvas</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="min-h-[44px] min-w-[44px] gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="canvas" className="flex-1 mt-0 overflow-hidden">
            {children}
          </TabsContent>
          <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
            <ChatPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile: Canvas fullscreen with chat drawer (below md) */}
      <div className="flex md:hidden h-full flex-col relative">
        {/* Canvas takes full screen */}
        <div className="flex-1 overflow-hidden">{children}</div>

        {/* Floating chat button */}
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
              aria-label="Open chat"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-full sm:max-w-md p-0"
            showCloseButton={false}
          >
            <ChatPanel />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
