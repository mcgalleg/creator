"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Pencil, Lock, Loader2 } from "lucide-react";
import { DynamicDashboard } from "./dynamic-dashboard";
import { useHasFeature } from "@/contexts/feature-context";
import { useDrawingBridgeOptional } from "@/contexts/drawing-bridge-context";

// Dynamically import ExcalidrawView to avoid loading Excalidraw until needed
const ExcalidrawView = dynamic(
  () => import("../excalidraw/excalidraw-view").then((mod) => mod.ExcalidrawView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface ViewTabsProps {
  accounts: Array<{ id: number; username: string; avatarUrl: string | null }>;
  hasNewDrawContent?: boolean;
  onDrawContentViewed?: () => void;
  /** Controlled tab value */
  activeTab?: "dashboard" | "draw";
  /** Callback when tab changes */
  onTabChange?: (tab: "dashboard" | "draw") => void;
}

export function ViewTabs({
  accounts,
  hasNewDrawContent = false,
  onDrawContentViewed,
  activeTab,
  onTabChange,
}: ViewTabsProps) {
  const canAccessCanvas = useHasFeature("canvas");
  const drawingBridge = useDrawingBridgeOptional();

  // Register tab switcher so "View in Draw" buttons can programmatically switch tabs
  useEffect(() => {
    if (drawingBridge && onTabChange && canAccessCanvas) {
      drawingBridge.registerTabSwitcher(() => onTabChange("draw"));
    }
  }, [drawingBridge, onTabChange, canAccessCanvas]);

  const handleTabChange = (value: string) => {
    const tab = value as "dashboard" | "draw";
    // Prevent switching to draw if user doesn't have access
    if (tab === "draw" && !canAccessCanvas) {
      return;
    }
    if (tab === "draw" && onDrawContentViewed) {
      onDrawContentViewed();
    }
    onTabChange?.(tab);
  };

  // Use controlled props if provided, otherwise use defaultValue for uncontrolled
  const tabProps = activeTab !== undefined
    ? { value: activeTab, onValueChange: handleTabChange }
    : { defaultValue: "dashboard" as const, onValueChange: handleTabChange };

  return (
    <Tabs
      {...tabProps}
      className="flex h-full flex-col"
    >
      <TabsList variant="line" className="border-b w-full justify-start px-4">
        <TabsTrigger value="dashboard" className="min-h-[44px] gap-2">
          <LayoutDashboard className="size-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger
          value="draw"
          className="min-h-[44px] gap-2"
          disabled={!canAccessCanvas}
        >
          {canAccessCanvas ? (
            <Pencil className="size-4" />
          ) : (
            <Lock className="size-4 text-muted-foreground" />
          )}
          Draw
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
      </TabsList>

      <TabsContent value="dashboard" className="flex-1 mt-0 overflow-auto p-6">
        <DynamicDashboard accounts={accounts} />
      </TabsContent>

      {/* Force mount draw so it can receive element push events even when not visible */}
      {canAccessCanvas && (
        <TabsContent value="draw" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden" forceMount>
          <ExcalidrawView />
        </TabsContent>
      )}
    </Tabs>
  );
}
