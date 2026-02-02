"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BreakpointLayouts, WidgetPosition } from "@/lib/db/schema/dashboard-layouts";

interface DashboardLayoutData {
  id: number;
  userId: string;
  name: string;
  isDefault: boolean | null;
  layouts: BreakpointLayouts | null;
  widgetConfigs: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface UseDashboardLayoutOptions {
  layoutId?: number;
}

interface UseDashboardLayoutReturn {
  layout: DashboardLayoutData | null;
  layouts: BreakpointLayouts | null;
  widgetConfigs: Record<string, unknown>;
  isLoading: boolean;
  error: Error | null;
  updateLayout: (newLayouts: BreakpointLayouts) => Promise<void>;
  updateWidgetConfig: (widgetId: string, config: Record<string, unknown>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Default layout for new dashboards
 */
export const DEFAULT_LAYOUTS: BreakpointLayouts = {
  lg: [
    { id: "kpi-followers", widgetType: "kpi-followers", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "kpi-views", widgetType: "kpi-views", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "kpi-engagement", widgetType: "kpi-engagement", x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "kpi-velocity", widgetType: "kpi-velocity", x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "engagement-chart", widgetType: "engagement-chart", x: 0, y: 2, w: 12, h: 4, minW: 6, minH: 3 },
    { id: "top-content", widgetType: "top-content", x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
    { id: "breakdown-chart", widgetType: "breakdown-chart", x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
    { id: "recent-posts", widgetType: "recent-posts", x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { id: "kpi-followers", widgetType: "kpi-followers", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "kpi-views", widgetType: "kpi-views", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "kpi-engagement", widgetType: "kpi-engagement", x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "kpi-velocity", widgetType: "kpi-velocity", x: 3, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { id: "engagement-chart", widgetType: "engagement-chart", x: 0, y: 4, w: 6, h: 4, minW: 6, minH: 3 },
    { id: "top-content", widgetType: "top-content", x: 0, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
    { id: "breakdown-chart", widgetType: "breakdown-chart", x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
    { id: "recent-posts", widgetType: "recent-posts", x: 0, y: 16, w: 6, h: 4, minW: 6, minH: 3 },
  ],
  sm: [
    { id: "kpi-followers", widgetType: "kpi-followers", x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 2 },
    { id: "kpi-views", widgetType: "kpi-views", x: 0, y: 2, w: 6, h: 2, minW: 2, minH: 2 },
    { id: "kpi-engagement", widgetType: "kpi-engagement", x: 0, y: 4, w: 6, h: 2, minW: 2, minH: 2 },
    { id: "kpi-velocity", widgetType: "kpi-velocity", x: 0, y: 6, w: 6, h: 2, minW: 2, minH: 2 },
    { id: "engagement-chart", widgetType: "engagement-chart", x: 0, y: 8, w: 6, h: 4, minW: 6, minH: 3 },
    { id: "top-content", widgetType: "top-content", x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
    { id: "breakdown-chart", widgetType: "breakdown-chart", x: 0, y: 16, w: 6, h: 4, minW: 4, minH: 3 },
    { id: "recent-posts", widgetType: "recent-posts", x: 0, y: 20, w: 6, h: 4, minW: 6, minH: 3 },
  ],
};

/**
 * Hook to manage dashboard layout state
 * Fetches layout from API and provides optimistic updates
 */
export function useDashboardLayout(
  options: UseDashboardLayoutOptions = {}
): UseDashboardLayoutReturn {
  const { layoutId } = options;

  const [layout, setLayout] = useState<DashboardLayoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track pending updates for debouncing
  const pendingUpdateRef = useRef<BreakpointLayouts | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLayout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all layouts and get the default or first one
      const response = await fetch("/api/dashboard/layouts");

      if (!response.ok) {
        throw new Error("Failed to fetch layouts");
      }

      const data = await response.json();
      const layouts = data.layouts as DashboardLayoutData[];

      if (layouts.length === 0) {
        setLayout(null);
        return;
      }

      // Find the specific layout by ID, or use default, or use first
      let targetLayout: DashboardLayoutData | undefined;

      if (layoutId) {
        targetLayout = layouts.find((l) => l.id === layoutId);
      }

      if (!targetLayout) {
        targetLayout = layouts.find((l) => l.isDefault) ?? layouts[0];
      }

      setLayout(targetLayout);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [layoutId]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const updateLayout = useCallback(
    async (newLayouts: BreakpointLayouts) => {
      if (!layout) return;

      // Optimistic update
      setLayout((prev) => (prev ? { ...prev, layouts: newLayouts } : null));

      // Store pending update
      pendingUpdateRef.current = newLayouts;

      // Debounce API call
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        const layoutsToSave = pendingUpdateRef.current;
        if (!layoutsToSave) return;

        try {
          const response = await fetch(`/api/dashboard/layouts/${layout.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layouts: layoutsToSave }),
          });

          if (!response.ok) {
            throw new Error("Failed to save layout");
          }

          pendingUpdateRef.current = null;
        } catch (err) {
          // Revert optimistic update on error
          console.error("Failed to save layout:", err);
          setError(err instanceof Error ? err : new Error("Failed to save layout"));
          // Refetch to get correct state
          fetchLayout();
        }
      }, 500); // Debounce for 500ms
    },
    [layout, fetchLayout]
  );

  const updateWidgetConfig = useCallback(
    async (widgetId: string, config: Record<string, unknown>) => {
      if (!layout) return;

      const currentConfigs = layout.widgetConfigs ?? {};
      const newConfigs = {
        ...currentConfigs,
        [widgetId]: { ...(currentConfigs[widgetId] as Record<string, unknown> ?? {}), ...config },
      };

      // Optimistic update
      setLayout((prev) => (prev ? { ...prev, widgetConfigs: newConfigs } : null));

      try {
        const response = await fetch(`/api/dashboard/layouts/${layout.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widgetConfigs: newConfigs }),
        });

        if (!response.ok) {
          throw new Error("Failed to save widget config");
        }
      } catch (err) {
        console.error("Failed to save widget config:", err);
        setError(err instanceof Error ? err : new Error("Failed to save widget config"));
        // Refetch to get correct state
        fetchLayout();
      }
    },
    [layout, fetchLayout]
  );

  return {
    layout,
    layouts: layout?.layouts ?? null,
    widgetConfigs: layout?.widgetConfigs ?? {},
    isLoading,
    error,
    updateLayout,
    updateWidgetConfig,
    refetch: fetchLayout,
  };
}

/**
 * Helper to add a widget to the layout at the appropriate position
 */
export function addWidgetToLayout(
  layouts: BreakpointLayouts,
  widget: Omit<WidgetPosition, "x" | "y">
): BreakpointLayouts {
  const findNextPosition = (
    existingWidgets: WidgetPosition[]
  ): { x: number; y: number } => {
    if (existingWidgets.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find the maximum y position
    const maxY = Math.max(...existingWidgets.map((w) => w.y + w.h));

    // Add widget at the bottom
    return { x: 0, y: maxY };
  };

  return {
    lg: [
      ...layouts.lg,
      {
        ...widget,
        ...findNextPosition(layouts.lg),
      },
    ],
    md: [
      ...layouts.md,
      {
        ...widget,
        w: Math.min(widget.w, 6),
        ...findNextPosition(layouts.md),
      },
    ],
    sm: [
      ...layouts.sm,
      {
        ...widget,
        w: 6,
        ...findNextPosition(layouts.sm),
      },
    ],
  };
}

/**
 * Helper to remove a widget from all breakpoint layouts
 */
export function removeWidgetFromLayout(
  layouts: BreakpointLayouts,
  widgetId: string
): BreakpointLayouts {
  return {
    lg: layouts.lg.filter((w) => w.id !== widgetId),
    md: layouts.md.filter((w) => w.id !== widgetId),
    sm: layouts.sm.filter((w) => w.id !== widgetId),
  };
}
