'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Pencil, Lock, Loader2 } from 'lucide-react';
import { SplitPaneLayout } from './split-pane-layout';
import { ViewTabs } from './view-tabs';
import { DefaultDashboard } from './default-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDrawingBridge, useDrawingBridgeOptional, DrawingBridgeProvider } from '@/contexts/drawing-bridge-context';
import { useHasFeature } from '@/contexts/feature-context';
import { UpgradePrompt } from '@/components/upgrade-prompt';

// Dynamically import ExcalidrawView to avoid loading Excalidraw until needed
const ExcalidrawView = dynamic(
  () => import('../excalidraw/excalidraw-view').then((mod) => mod.ExcalidrawView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

// ChatPanel imports AI SDK
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

/**
 * Registers a tab switcher callback with the DrawingBridge context.
 * Must be rendered inside a DrawingBridgeProvider.
 */
function TabSwitcherRegistrar({ onSwitch }: { onSwitch: () => void }) {
  const drawingBridge = useDrawingBridge();
  useEffect(() => {
    drawingBridge.registerTabSwitcher(onSwitch);
  }, [drawingBridge, onSwitch]);
  return null;
}

interface ResponsiveLayoutProps {
  accounts: Array<{ id: number; username: string }>;
  children?: React.ReactNode;
}

/**
 * Responsive layout that adapts to different screen sizes:
 * - Desktop (lg+): Full split-pane layout with ChatPanel left, ViewTabs right
 * - Tablet (md): Tabs-based navigation between Dashboard, Draw, and Chat
 * - Mobile (sm and below): ViewTabs (Dashboard/Draw) with chat as slide-in drawer
 */
export function ResponsiveLayout({
  accounts,
  children,
}: ResponsiveLayoutProps) {
  const [tabletTab, setTabletTab] = useState<'dashboard' | 'draw' | 'chat'>('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const canAccessChat = useHasFeature("analytics_assistant");
  const canAccessCanvas = useHasFeature("canvas");

  // Defer Tabs rendering until after hydration to prevent Radix ID mismatches
  // caused by dynamic imports (ssr:false) creating different trees on server vs client
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional for hydration handling
    setMounted(true);
  }, []);

  // Check if we're on a sub-page (accounts, settings) that needs to render children
  const isMainDashboard = pathname === '/dashboard';

  // Track if user has new draw content
  const drawingBridge = useDrawingBridgeOptional();
  const hasNewDrawContent = drawingBridge?.hasNewContent ?? false;

  // Track active tab for controlled ViewTabs (desktop)
  const [activeTab, setActiveTab] = useState<"dashboard" | "draw">("dashboard");

  const handleDrawContentViewed = useCallback(() => {
    drawingBridge?.markContentViewed();
  }, [drawingBridge]);

  const handleTabletTabChange = (value: string) => {
    const tab = value as 'dashboard' | 'draw' | 'chat';
    if (tab === 'draw' && !canAccessCanvas) return;
    if (tab === 'chat' && !canAccessChat) return;
    setTabletTab(tab);
    if (tab === 'draw') {
      handleDrawContentViewed();
    }
  };

  const switchTabletToDraw = useCallback(() => {
    if (canAccessCanvas) {
      setTabletTab('draw');
    }
  }, [canAccessCanvas]);

  // If on a sub-page (accounts/settings), render children directly
  if (!isMainDashboard) {
    return (
      <div className="h-full overflow-auto p-6">
        {children}
      </div>
    );
  }

  // Show skeleton until after hydration to prevent Radix ID mismatches
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Otherwise render the full dashboard layout with ViewTabs
  return (
    <>
      {/* Desktop: Full split-pane layout (lg and above) */}
      <div className="hidden lg:block h-full">
        <SplitPaneLayout>
          <ViewTabs
            accounts={accounts}
            hasNewDrawContent={hasNewDrawContent}
            onDrawContentViewed={handleDrawContentViewed}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </SplitPaneLayout>
      </div>

      {/* Tablet: Tabs-based navigation (md only) */}
      <div className="hidden md:flex lg:hidden h-full flex-col">
        <DrawingBridgeProvider>
          <TabSwitcherRegistrar onSwitch={switchTabletToDraw} />
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
                value="draw"
                className="min-h-[44px] min-w-[44px] gap-2"
                disabled={!canAccessCanvas}
              >
                {canAccessCanvas ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Draw</span>
                {canAccessCanvas && hasNewDrawContent && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                    New
                  </Badge>
                )}
                {!canAccessCanvas && (
                  <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px] text-muted-foreground">
                    Pro
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="min-h-[44px] min-w-[44px] gap-2"
                disabled={!canAccessChat}
              >
                {canAccessChat ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Chat</span>
                {!canAccessChat && (
                  <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px] text-muted-foreground">
                    Pro
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="flex-1 mt-0 overflow-auto p-6">
              <DefaultDashboard accounts={accounts} />
            </TabsContent>
            {/* Force mount draw so it can receive element push events even when not visible */}
            <TabsContent value="draw" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden" forceMount>
              {canAccessCanvas ? (
                <ExcalidrawView />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <UpgradePrompt feature="canvas" />
                </div>
              )}
            </TabsContent>
            <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
              {canAccessChat ? (
                <ChatPanel />
              ) : (
                <UpgradePrompt feature="analytics_assistant" compact />
              )}
            </TabsContent>
          </Tabs>
        </DrawingBridgeProvider>
      </div>

      {/* Mobile: ViewTabs with chat drawer (below md) */}
      <div className="flex md:hidden h-full flex-col relative">
        <DrawingBridgeProvider>
          {/* ViewTabs takes full screen */}
          <div className="flex-1 overflow-hidden">
            <ViewTabs
              accounts={accounts}
              hasNewDrawContent={hasNewDrawContent}
              onDrawContentViewed={handleDrawContentViewed}
            />
          </div>

          {/* Floating chat button - only show if user has access */}
          {canAccessChat && (
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
          )}
        </DrawingBridgeProvider>
      </div>
    </>
  );
}
