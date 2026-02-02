"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Settings2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { BreakpointLayouts, WidgetPosition } from "@/lib/db/schema/dashboard-layouts";
import { useBreakpoint, Breakpoint } from "@/hooks/use-breakpoint";
import { DashboardWidget } from "./dashboard-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardGridProps {
  layout: BreakpointLayouts;
  accountId: number | null;
  period: "7d" | "30d" | "90d";
  widgetConfigs?: Record<string, Record<string, unknown>>;
  isEditing?: boolean;
  onEditToggle?: () => void;
  onLayoutChange?: (layout: BreakpointLayouts) => void;
  onWidgetDelete?: (widgetId: string) => void;
  onWidgetConfigChange?: (widgetId: string, config: Record<string, unknown>) => void;
  className?: string;
}

// Grid configuration per breakpoint
const GRID_CONFIG: Record<Breakpoint, { columns: number; gap: number; rowHeight: number }> = {
  lg: { columns: 12, gap: 16, rowHeight: 80 },
  md: { columns: 6, gap: 12, rowHeight: 80 },
  sm: { columns: 6, gap: 8, rowHeight: 60 },
};

export function DashboardGrid({
  layout,
  accountId,
  period,
  widgetConfigs = {},
  isEditing = false,
  onEditToggle,
  onLayoutChange,
  onWidgetDelete,
  onWidgetConfigChange,
  className,
}: DashboardGridProps) {
  const breakpoint = useBreakpoint();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Get current layout for the breakpoint
  const currentLayout = layout[breakpoint];
  const gridConfig = GRID_CONFIG[breakpoint];

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate grid height based on widget positions
  const gridHeight = React.useMemo(() => {
    if (currentLayout.length === 0) return 200;
    const maxY = Math.max(...currentLayout.map((w) => w.y + w.h));
    return maxY * gridConfig.rowHeight + (maxY - 1) * gridConfig.gap;
  }, [currentLayout, gridConfig]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !onLayoutChange) {
      return;
    }

    const oldIndex = currentLayout.findIndex((w) => w.id === active.id);
    const newIndex = currentLayout.findIndex((w) => w.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the current breakpoint layout
    const reorderedWidgets = arrayMove(currentLayout, oldIndex, newIndex);

    // Recalculate y positions based on new order
    const updatedWidgets = recalculatePositions(reorderedWidgets, gridConfig.columns);

    // Create new layouts object with updated breakpoint
    const newLayout: BreakpointLayouts = {
      ...layout,
      [breakpoint]: updatedWidgets,
    };

    onLayoutChange(newLayout);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeWidget = activeId
    ? currentLayout.find((w) => w.id === activeId)
    : null;

  // Empty state
  if (currentLayout.length === 0) {
    return (
      <div className={cn("relative", className)}>
        {onEditToggle && (
          <div className="flex justify-end mb-4">
            <EditModeToggle isEditing={isEditing} onToggle={onEditToggle} />
          </div>
        )}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <GripVertical className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No widgets added yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Click the edit button and add widgets to customize your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Edit Mode Toggle */}
      {onEditToggle && (
        <div className="flex justify-end mb-4">
          <EditModeToggle isEditing={isEditing} onToggle={onEditToggle} />
        </div>
      )}

      {/* Grid Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={currentLayout.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
              gap: gridConfig.gap,
              minHeight: gridHeight,
            }}
          >
            {currentLayout.map((widget) => (
              <div
                key={widget.id}
                style={{
                  gridColumn: `span ${widget.w}`,
                  gridRow: `span ${widget.h}`,
                  minHeight: widget.h * gridConfig.rowHeight,
                }}
              >
                <DashboardWidget
                  widget={widget}
                  accountId={accountId}
                  period={period}
                  config={widgetConfigs[widget.id]}
                  isEditing={isEditing}
                  onDelete={onWidgetDelete}
                  onConfigChange={onWidgetConfigChange}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay adjustScale={false}>
          {activeWidget && (
            <div
              className="rounded-lg bg-card border-2 border-primary shadow-2xl opacity-90"
              style={{
                width: `calc((100% - ${(gridConfig.columns - 1) * gridConfig.gap}px) / ${gridConfig.columns} * ${activeWidget.w} + ${(activeWidget.w - 1) * gridConfig.gap}px)`,
                height: activeWidget.h * gridConfig.rowHeight,
              }}
            >
              <DashboardWidget
                widget={activeWidget}
                accountId={accountId}
                period={period}
                config={widgetConfigs[activeWidget.id]}
                isEditing={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit Mode Indicator */}
      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium">
            Edit Mode - Drag widgets to reorder
          </div>
        </div>
      )}
    </div>
  );
}

interface EditModeToggleProps {
  isEditing: boolean;
  onToggle: () => void;
}

function EditModeToggle({ isEditing, onToggle }: EditModeToggleProps) {
  return (
    <Button
      variant={isEditing ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className="gap-2"
    >
      <Settings2 className="h-4 w-4" />
      {isEditing ? "Done Editing" : "Edit Dashboard"}
    </Button>
  );
}

/**
 * Recalculate widget positions after reordering
 * Uses a simple flow layout algorithm
 */
function recalculatePositions(
  widgets: WidgetPosition[],
  columns: number
): WidgetPosition[] {
  const result: WidgetPosition[] = [];
  let currentY = 0;
  let currentX = 0;
  let rowHeight = 0;

  for (const widget of widgets) {
    const widgetWidth = Math.min(widget.w, columns);

    // Check if widget fits in current row
    if (currentX + widgetWidth > columns) {
      // Move to next row
      currentY += rowHeight;
      currentX = 0;
      rowHeight = 0;
    }

    result.push({
      ...widget,
      x: currentX,
      y: currentY,
      w: widgetWidth,
    });

    currentX += widgetWidth;
    rowHeight = Math.max(rowHeight, widget.h);

    // If row is full, move to next row
    if (currentX >= columns) {
      currentY += rowHeight;
      currentX = 0;
      rowHeight = 0;
    }
  }

  return result;
}

export type { DashboardGridProps };
