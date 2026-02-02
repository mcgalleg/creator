"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
// Import from index to trigger widget registration
import { widgetRegistry, WidgetProps } from "@/lib/widgets";
import { WidgetPosition } from "@/lib/db/schema/dashboard-layouts";
import { DashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardWidgetProps {
  widget: WidgetPosition;
  accountId: number | null;
  period: "7d" | "30d" | "90d";
  dashboardData?: DashboardData;
  isDataLoading?: boolean;
  config?: Record<string, unknown>;
  isEditing: boolean;
  onDelete?: (widgetId: string) => void;
  onConfigChange?: (widgetId: string, config: Record<string, unknown>) => void;
  style?: React.CSSProperties;
}

/**
 * Maps widget type to the appropriate data from dashboardData
 * Returns data in the format expected by each widget's props
 */
function getWidgetData(
  widgetType: string,
  dashboardData?: DashboardData
): unknown {
  if (!dashboardData) return null;

  const { overview, engagement, topContent, recentPosts, breakdown } = dashboardData;

  switch (widgetType) {
    // KPI widgets - map from overview metrics
    case "followers":
      return overview?.metrics
        ? { followers: overview.metrics.followers, followerChange: overview.metrics.followerChange }
        : null;
    case "total-plays":
      return overview?.metrics
        ? { totalPlays: overview.metrics.totalPlays, playsChange: overview.metrics.playsChange }
        : null;
    case "engagement-rate":
      return overview?.metrics
        ? { engagementRate: overview.metrics.engagementRate, engagementRateChange: overview.metrics.engagementRateChange }
        : null;
    case "total-likes":
      // Calculate from engagement data
      if (engagement?.data) {
        const totalLikes = engagement.data.reduce((sum, d) => sum + d.likes, 0);
        return { totalLikes, likesChange: 0 };
      }
      return null;
    case "total-shares":
      if (engagement?.data) {
        const totalShares = engagement.data.reduce((sum, d) => sum + d.shares, 0);
        return { totalShares, sharesChange: 0 };
      }
      return null;
    case "total-saves":
      if (engagement?.data) {
        const totalSaves = engagement.data.reduce((sum, d) => sum + d.saves, 0);
        return { totalSaves, savesChange: 0 };
      }
      return null;
    case "avg-views":
      if (engagement?.data && engagement.data.length > 0) {
        const totalPlays = engagement.data.reduce((sum, d) => sum + d.plays, 0);
        const avgViews = totalPlays / engagement.data.length;
        return { avgViews, avgViewsChange: 0 };
      }
      return null;
    case "content-velocity":
      return overview?.metrics
        ? {
            postsPerWeek: overview.metrics.contentVelocity,
            postsPerMonth: overview.metrics.contentVelocity * 4,
            velocityChange: 0,
            totalPosts: recentPosts?.total ?? 0,
            periodDays: 30,
          }
        : null;
    case "overview-metrics":
      return overview?.metrics ?? null;

    // Chart widgets - pass the array directly, not wrapped in {data:}
    case "engagement-trend":
      return engagement?.data ?? null;
    case "engagement-breakdown":
      return breakdown?.breakdown ?? null;

    // Content widgets - pass the array directly
    case "top-content":
      return topContent?.videos ?? null;
    case "recent-posts":
      return recentPosts ?? null;

    default:
      return null;
  }
}

export function DashboardWidget({
  widget,
  accountId,
  period,
  dashboardData,
  isDataLoading = false,
  config,
  isEditing,
  onDelete,
  onConfigChange,
  style,
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !isEditing,
  });

  const widgetDef = widgetRegistry.get(widget.widgetType);

  const combinedStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Handle missing widget definition
  if (!widgetDef) {
    return (
      <div
        ref={setNodeRef}
        style={combinedStyle}
        className={cn(
          "relative rounded-lg border bg-card",
          isDragging && "shadow-lg"
        )}
      >
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unknown Widget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Widget type &quot;{widget.widgetType}&quot; is not registered.
            </p>
          </CardContent>
        </Card>
        {isEditing && (
          <WidgetEditOverlay
            attributes={attributes}
            listeners={listeners}
            onDelete={() => onDelete?.(widget.id)}
          />
        )}
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;

  // Get the appropriate data for this widget type
  const widgetData = getWidgetData(widget.widgetType, dashboardData);

  const widgetProps: WidgetProps & { data?: unknown; isLoading?: boolean } = {
    id: widget.id,
    accountId,
    period,
    config,
    isEditing,
    onConfigChange: onConfigChange
      ? (newConfig) => onConfigChange(widget.id, newConfig)
      : undefined,
    // Pass data and loading state to widget
    data: widgetData,
    isLoading: isDataLoading,
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      className={cn(
        "relative rounded-lg",
        isDragging && "shadow-lg ring-2 ring-primary",
        isEditing && "ring-1 ring-border"
      )}
    >
      <div className="h-full">
        <WidgetComponent {...widgetProps} />
      </div>
      {isEditing && (
        <WidgetEditOverlay
          widgetName={widgetDef.name}
          attributes={attributes}
          listeners={listeners}
          onDelete={() => onDelete?.(widget.id)}
          onSettings={() => {
            // TODO: Open widget settings dialog
          }}
        />
      )}
    </div>
  );
}

interface WidgetEditOverlayProps {
  widgetName?: string;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  onDelete?: () => void;
  onSettings?: () => void;
}

function WidgetEditOverlay({
  widgetName,
  attributes,
  listeners,
  onDelete,
  onSettings,
}: WidgetEditOverlayProps) {
  return (
    <TooltipProvider>
      <div className="absolute inset-0 pointer-events-none">
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 pointer-events-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  "bg-background/80 backdrop-blur-sm border shadow-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "cursor-grab active:cursor-grabbing",
                  "transition-colors"
                )}
                aria-label={`Drag ${widgetName ?? "widget"}`}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Drag to reorder</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
          {onSettings && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={onSettings}
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Widget settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 shadow-sm"
                  onClick={onDelete}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove widget</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Remove widget</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export type { DashboardWidgetProps };
