"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle, RefreshCw, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DashboardGrid } from "./dashboard-grid";
import { WidgetPicker } from "./widget-picker";
import {
  useDashboardLayout,
  addWidgetToLayout,
  removeWidgetFromLayout,
  DEFAULT_LAYOUTS,
} from "@/hooks/use-dashboard-layout";
import { useDashboardData, Period } from "@/hooks/use-dashboard-data";
import { widgetRegistry } from "@/lib/widgets";
import { BreakpointLayouts } from "@/lib/db/schema/dashboard-layouts";

interface DynamicDashboardProps {
  accounts: Array<{ id: number; username: string }>;
}

export function DynamicDashboard({ accounts }: DynamicDashboardProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    accounts.length > 0 ? accounts[0].id : null
  );
  const [period, setPeriod] = useState<Period>("30d");
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const {
    layout,
    layouts,
    widgetConfigs,
    isLoading: layoutLoading,
    error: layoutError,
    updateLayout,
    updateWidgetConfig,
    refetch: refetchLayout,
  } = useDashboardLayout();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = useDashboardData({
    accountId: selectedAccountId,
    period,
  });

  // Update selected account if accounts list changes
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional initialization from async data
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Create default layout if none exists
  useEffect(() => {
    const createDefaultLayout = async () => {
      if (!layoutLoading && !layout && accounts.length > 0) {
        try {
          const response = await fetch("/api/dashboard/layouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Default Dashboard",
              isDefault: true,
              layouts: DEFAULT_LAYOUTS,
              widgetConfigs: {},
            }),
          });
          if (response.ok) {
            refetchLayout();
          }
        } catch (error) {
          console.error("Failed to create default layout:", error);
        }
      }
    };
    createDefaultLayout();
  }, [layoutLoading, layout, accounts.length, refetchLayout]);

  const handleLayoutChange = useCallback(
    (newLayouts: BreakpointLayouts) => {
      updateLayout(newLayouts);
    },
    [updateLayout]
  );

  const handleWidgetDelete = useCallback(
    (widgetId: string) => {
      if (!layouts) return;
      const newLayouts = removeWidgetFromLayout(layouts, widgetId);
      updateLayout(newLayouts);
    },
    [layouts, updateLayout]
  );

  const handleWidgetConfigChange = useCallback(
    (widgetId: string, config: Record<string, unknown>) => {
      updateWidgetConfig(widgetId, config);
    },
    [updateWidgetConfig]
  );

  // Get the effective layouts (use default if none loaded yet)
  const effectiveLayouts = layouts ?? DEFAULT_LAYOUTS;

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      // Get widget definition from registry
      const widgetDef = widgetRegistry.get(widgetId);
      if (!widgetDef) {
        console.error(`Widget ${widgetId} not found in registry`);
        return;
      }

      // Create a unique instance ID
      const instanceId = `${widgetId}-${Date.now()}`;

      // Add widget to layout - use effectiveLayouts to ensure we always have a base
      const newLayouts = addWidgetToLayout(effectiveLayouts, {
        id: instanceId,
        widgetType: widgetId,
        w: widgetDef.defaultSize.w,
        h: widgetDef.defaultSize.h,
        minW: widgetDef.minSize.w,
        minH: widgetDef.minSize.h,
      });

      updateLayout(newLayouts);
    },
    [effectiveLayouts, updateLayout]
  );

  // Empty state when no accounts
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          No accounts connected
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Connect a TikTok account to see your analytics, engagement trends, and content performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Account Selector */}
          <Select
            value={selectedAccountId?.toString() ?? ""}
            onValueChange={(value) => setSelectedAccountId(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  @{account.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period Selector */}
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Widget Button (only in edit mode) */}
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWidgetPicker(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        )}
      </div>

      {/* Error state */}
      {(layoutError || dataError) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                {layoutError ? "Error loading dashboard layout" : "Error loading dashboard data"}
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {layoutError?.message || dataError?.message}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (layoutError) refetchLayout();
                if (dataError) refetchData();
              }}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {layoutLoading ? (
        <DashboardLoadingSkeleton />
      ) : (
        <DashboardGrid
          layout={effectiveLayouts}
          accountId={selectedAccountId}
          period={period}
          dashboardData={dashboardData}
          isDataLoading={dataLoading}
          widgetConfigs={widgetConfigs as Record<string, Record<string, unknown>>}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onLayoutChange={handleLayoutChange}
          onWidgetDelete={handleWidgetDelete}
          onWidgetConfigChange={handleWidgetConfigChange}
        />
      )}

      {/* Widget Picker Dialog */}
      <WidgetPicker
        isOpen={showWidgetPicker}
        onClose={() => setShowWidgetPicker(false)}
        onWidgetSelect={handleAddWidget}
      />
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>

      {/* Engagement chart skeleton */}
      <Skeleton className="h-[350px] rounded-xl" />

      {/* Top content and breakdown skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>

      {/* Recent posts table skeleton */}
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}
