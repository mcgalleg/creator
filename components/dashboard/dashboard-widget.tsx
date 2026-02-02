"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
// Import from index to trigger widget registration
import { widgetRegistry, WidgetProps } from "@/lib/widgets";
import { WidgetPosition } from "@/lib/db/schema/dashboard-layouts";
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
  config?: Record<string, unknown>;
  isEditing: boolean;
  onDelete?: (widgetId: string) => void;
  onConfigChange?: (widgetId: string, config: Record<string, unknown>) => void;
  style?: React.CSSProperties;
}

export function DashboardWidget({
  widget,
  accountId,
  period,
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

  const widgetProps: WidgetProps = {
    id: widget.id,
    accountId,
    period,
    config,
    isEditing,
    onConfigChange: onConfigChange
      ? (newConfig) => onConfigChange(widget.id, newConfig)
      : undefined,
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
