'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Sparkles } from 'lucide-react';
import { ChatPanel } from './chat-panel';
import { SplitPaneLayout } from './split-pane-layout';
import { ViewTabs } from './view-tabs';
import { DefaultDashboard } from './default-dashboard';
import { CanvasView } from './canvas-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePinToCanvasOptional, PinToCanvasProvider } from '@/contexts/pin-to-canvas-context';

interface ResponsiveLayoutProps {
  accounts: Array<{ id: number; username: string }>;
  children?: React.ReactNode;
}

/**
 * Responsive layout that adapts to different screen sizes:
 * - Desktop (lg+): Full split-pane layout with ChatPanel left, ViewTabs right
 * - Tablet (md): Tabs-based navigation between Dashboard, Canvas, and Chat
 * - Mobile (sm and below): ViewTabs (Dashboard/Canvas) with chat as slide-in drawer
 */
export function ResponsiveLayout({
  accounts,
  children,
}: ResponsiveLayoutProps) {
  const [tabletTab, setTabletTab] = useState<'dashboard' | 'canvas' | 'chat'>('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();

  // Check if we're on a sub-page (accounts, settings) that needs to render children
  // vs the main dashboard page which renders ViewTabs
  const isMainDashboard = pathname === '/dashboard';

  // Track if user has new canvas content (from queued renders in context)
  const pinContext = usePinToCanvasOptional();
  const hasNewCanvasContent = pinContext?.hasQueuedRenders ?? false;

  // Track active tab for controlled ViewTabs (desktop)
  const [activeTab, setActiveTab] = useState<"dashboard" | "canvas">("dashboard");

  // Also track locally added content (after toast notification)
  const [hasLocalNewContent, setHasLocalNewContent] = useState(false);
  const showNewBadge = hasNewCanvasContent || hasLocalNewContent;

  const handleVisualizationAdded = useCallback(() => {
    setHasLocalNewContent(true);
  }, []);

  const handleSwitchToCanvas = useCallback(() => {
    setActiveTab("canvas");
    setHasLocalNewContent(false);
  }, []);

  const handleCanvasContentViewed = useCallback(() => {
    setHasLocalNewContent(false);
  }, []);

  const handleTabletTabChange = (value: string) => {
    setTabletTab(value as 'dashboard' | 'canvas' | 'chat');
    if (value === 'canvas') {
      handleCanvasContentViewed();
    }
  };

  // If on a sub-page (accounts/settings), render children directly
  if (!isMainDashboard) {
    return (
      <div className="h-full overflow-auto p-6">
        {children}
      </div>
    );
  }

  // Otherwise render the full dashboard layout with ViewTabs
  return (
    <>
      {/* Desktop: Full split-pane layout (lg and above) */}
      <div className="hidden lg:block h-full">
        <SplitPaneLayout
          onVisualizationAdded={handleVisualizationAdded}
          onSwitchToCanvas={handleSwitchToCanvas}
        >
          <ViewTabs
            accounts={accounts}
            hasNewCanvasContent={showNewBadge}
            onCanvasContentViewed={handleCanvasContentViewed}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </SplitPaneLayout>
      </div>

      {/* Tablet: Tabs-based navigation (md only) */}
      <div className="hidden md:flex lg:hidden h-full flex-col">
        <PinToCanvasProvider>
          <Tabs
            value={tabletTab}
            onValueChange={handleTabletTabChange}
            className="flex-1 flex flex-col"
          >
            <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
              <TabsTrigger
                value="dashboard"
                className="min-h-[44px] min-w-[44px] gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="canvas"
                className="min-h-[44px] min-w-[44px] gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Canvas</span>
                {showNewBadge && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                    New
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="min-h-[44px] min-w-[44px] gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="flex-1 mt-0 overflow-auto p-6">
              <DefaultDashboard accounts={accounts} />
            </TabsContent>
            {/* Force mount canvas so it can receive render events even when not visible */}
            <TabsContent value="canvas" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden" forceMount>
              <CanvasView />
            </TabsContent>
            <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
              <ChatPanel onVisualizationAdded={handleVisualizationAdded} />
            </TabsContent>
          </Tabs>
        </PinToCanvasProvider>
      </div>

      {/* Mobile: ViewTabs with chat drawer (below md) */}
      <div className="flex md:hidden h-full flex-col relative">
        <PinToCanvasProvider>
          {/* ViewTabs takes full screen */}
          <div className="flex-1 overflow-hidden">
            <ViewTabs
              accounts={accounts}
              hasNewCanvasContent={showNewBadge}
              onCanvasContentViewed={handleCanvasContentViewed}
            />
          </div>

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
              <ChatPanel onVisualizationAdded={handleVisualizationAdded} />
            </SheetContent>
          </Sheet>
        </PinToCanvasProvider>
      </div>
    </>
  );
}
