import { ComponentType } from "react";

export type WidgetCategory = "kpi" | "chart" | "content" | "engagement" | "comments";

export interface DataRequirement {
  type: "profile" | "posts" | "comments" | "metrics";
  fields: string[];
}

export interface WidgetProps {
  id: string;
  accountId: number | null;
  period: "7d" | "30d" | "90d";
  config?: Record<string, unknown>;
  isEditing?: boolean;
  onConfigChange?: (config: Record<string, unknown>) => void;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: ComponentType<{ className?: string }>;
  component: ComponentType<WidgetProps>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  dataRequirements: DataRequirement[];
}

class WidgetRegistry {
  private widgets: Map<string, WidgetDefinition> = new Map();

  register(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget);
  }

  get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAll().filter(w => w.category === category);
  }
}

export const widgetRegistry = new WidgetRegistry();
