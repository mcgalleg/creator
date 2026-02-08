"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { BreakpointLayouts, WidgetPosition } from "@/lib/db/schema/dashboard-layouts";
import { useBreakpoint, Breakpoint } from "@/hooks/use-breakpoint";
import { DashboardWidget } from "./dashboard-widget";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardData } from "@/hooks/use-dashboard-data";

interface DashboardGridProps {
  layout: BreakpointLayouts;
  accountId: number | null;
  period: "7d" | "30d" | "90d";
  dashboardData?: DashboardData;
  isDataLoading?: boolean;
  widgetConfigs?: Record<string, Record<string, unknown>>;
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

// Sortable wrapper for grid items - this ensures drag transforms are applied to the grid cell
interface SortableGridItemProps {
  id: string;
  disabled: boolean;
  gridColumn: number;
  gridRow: number;
  minHeight: number;
  children: React.ReactNode;
}

function SortableGridItem({
  id,
  disabled,
  gridColumn,
  gridRow,
  minHeight,
  children,
}: SortableGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    gridColumn: `span ${gridColumn}`,
    gridRow: `span ${gridRow}`,
    minHeight,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function DashboardGrid({
  layout,
  accountId,
  period,
  dashboardData,
  isDataLoading = false,
  widgetConfigs = {},
  onLayoutChange,
  onWidgetDelete,
  onWidgetConfigChange,
  className,
}: DashboardGridProps) {
  const breakpoint = useBreakpoint();

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

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

  // Empty state
  if (currentLayout.length === 0) {
    return (
      <div className={cn("relative", className)}>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <GripVertical className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No widgets added yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Click &quot;Add Widget&quot; to customize your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Grid Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentLayout.map((w) => w.id)}
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
              <SortableGridItem
                key={widget.id}
                id={widget.id}
                disabled={false}
                gridColumn={widget.w}
                gridRow={widget.h}
                minHeight={widget.h * gridConfig.rowHeight}
              >
                <DashboardWidget
                  widget={widget}
                  accountId={accountId}
                  period={period}
                  dashboardData={dashboardData}
                  isDataLoading={isDataLoading}
                  config={widgetConfigs[widget.id]}
                  onDelete={onWidgetDelete}
                  onConfigChange={onWidgetConfigChange}
                />
              </SortableGridItem>
            ))}
          </div>
        </SortableContext>

      </DndContext>

    </div>
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
