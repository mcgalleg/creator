"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Sparkles, Lock } from "lucide-react";
import { DynamicDashboard } from "./dynamic-dashboard";
import { CanvasView } from "./canvas-view";
import { useFeatures } from "@/contexts/feature-context";
import { FeatureGate } from "@/components/feature-gate";

interface ViewTabsProps {
  accounts: Array<{ id: number; username: string }>;
  hasNewCanvasContent?: boolean;
  onCanvasContentViewed?: () => void;
  /** Controlled tab value */
  activeTab?: "dashboard" | "canvas";
  /** Callback when tab changes */
  onTabChange?: (tab: "dashboard" | "canvas") => void;
}

export function ViewTabs({
  accounts,
  hasNewCanvasContent = false,
  onCanvasContentViewed,
  activeTab,
  onTabChange,
}: ViewTabsProps) {
  const { hasAccess } = useFeatures();
  const canAccessCanvas = hasAccess("canvas");

  const handleTabChange = (value: string) => {
    const tab = value as "dashboard" | "canvas";
    // Prevent switching to canvas if user doesn't have access
    if (tab === "canvas" && !canAccessCanvas) {
      return;
    }
    if (tab === "canvas" && onCanvasContentViewed) {
      onCanvasContentViewed();
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
          value="canvas"
          className="min-h-[44px] gap-2"
          disabled={!canAccessCanvas}
        >
          {canAccessCanvas ? (
            <Sparkles className="size-4" />
          ) : (
            <Lock className="size-4 text-muted-foreground" />
          )}
          Canvas
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
      </TabsList>

      <TabsContent value="dashboard" className="flex-1 mt-0 overflow-auto p-6">
        <DynamicDashboard accounts={accounts} />
      </TabsContent>

      {/* Force mount canvas so it can receive render events even when not visible */}
      <FeatureGate feature="canvas">
        <TabsContent value="canvas" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden" forceMount>
          <CanvasView />
        </TabsContent>
      </FeatureGate>
    </Tabs>
  );
}
