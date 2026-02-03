'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Sparkles, Lock, Loader2 } from 'lucide-react';
import { SplitPaneLayout } from './split-pane-layout';
import { ViewTabs } from './view-tabs';
import { DefaultDashboard } from './default-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePinToCanvasOptional, PinToCanvasProvider } from '@/contexts/pin-to-canvas-context';
import { useFeatures } from '@/contexts/feature-context';
import { FeatureGate } from '@/components/feature-gate';
import { UpgradePrompt } from '@/components/upgrade-prompt';

// Dynamically import heavy components to speed up dev compilation
// CanvasView imports React Flow (~2MB)
const CanvasView = dynamic(
  () => import('./canvas-view').then((mod) => mod.CanvasView),
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
  const { hasAccess } = useFeatures();
  const canAccessChat = hasAccess("analytics_assistant");
  const canAccessCanvas = hasAccess("canvas");

  // Check if we're on a sub-page (accounts, settings) that needs to render children
  // vs the main dashboard page which renders ViewTabs
  const isMainDashboard = pathname === '/dashboard';

  // Track if user has new canvas content (from queued renders in context)
  const pinContext = usePinToCanvasOptional();
  const hasNewCanvasContent = pinContext?.hasQueuedRenders ?? false;

  // Track active tab for controlled ViewTabs (desktop)
  const [activeTab, setActiveTab] = useState<"dashboard" | "canvas">("dashboard");

  const handleCanvasContentViewed = useCallback(() => {
    // Canvas content viewed - context will handle clearing the badge
  }, []);

  const handleTabletTabChange = (value: string) => {
    const tab = value as 'dashboard' | 'canvas' | 'chat';
    // Prevent switching to gated features
    if (tab === 'canvas' && !canAccessCanvas) return;
    if (tab === 'chat' && !canAccessChat) return;
    setTabletTab(tab);
    if (tab === 'canvas') {
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
        <SplitPaneLayout>
          <ViewTabs
            accounts={accounts}
            hasNewCanvasContent={hasNewCanvasContent}
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
                disabled={!canAccessCanvas}
              >
                {canAccessCanvas ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Canvas</span>
                {canAccessCanvas && hasNewCanvasContent && (
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
            {/* Force mount canvas so it can receive render events even when not visible */}
            <TabsContent value="canvas" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden" forceMount>
              <FeatureGate
                feature="canvas"
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <UpgradePrompt feature="canvas" />
                  </div>
                }
              >
                <CanvasView />
              </FeatureGate>
            </TabsContent>
            <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
              <FeatureGate
                feature="analytics_assistant"
                fallback={<UpgradePrompt feature="analytics_assistant" compact />}
              >
                <ChatPanel />
              </FeatureGate>
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
              hasNewCanvasContent={hasNewCanvasContent}
              onCanvasContentViewed={handleCanvasContentViewed}
            />
          </div>

          {/* Floating chat button - only show if user has access */}
          <FeatureGate feature="analytics_assistant">
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
          </FeatureGate>
        </PinToCanvasProvider>
      </div>
    </>
  );
}
